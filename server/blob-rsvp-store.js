import { createHmac, randomBytes } from 'node:crypto';
import { get, list, put } from '@vercel/blob';

export function createBlobRsvpStore({ prefix, token, storeId, client = { get, list, put } }) {
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(prefix)) {
    throw new Error('RSVP_BLOB_PREFIX tidak valid.');
  }
  const configurationPath = `${prefix}/config.json`;
  const responsePrefix = `${prefix}/responses/`;
  const credentials = { ...(token ? { token } : {}), ...(storeId ? { storeId } : {}) };
  let secretPromise;

  function options() {
    return { ...credentials, abortSignal: AbortSignal.timeout(8000) };
  }

  async function readJson(pathname) {
    const result = await client.get(pathname, {
      ...options(),
      access: 'private',
      useCache: false,
    });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) throw new Error('Respons Blob tidak valid.');
    return new Response(result.stream).json();
  }

  async function createOnce(pathname, value) {
    return client.put(pathname, JSON.stringify(value), {
      ...options(),
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  }

  function validateConfiguration(configuration) {
    if (configuration?.version !== 1 || !/^[a-f0-9]{64}$/.test(configuration.secret)) {
      throw new Error('Konfigurasi Blob RSVP rusak. Data tidak direset.');
    }
    return configuration.secret;
  }

  async function initializeSecret() {
    const current = await readJson(configurationPath);
    if (current) return validateConfiguration(current);

    const existing = await client.list({ ...options(), prefix: responsePrefix, limit: 1 });
    if (existing.blobs.length) {
      throw new Error('Konfigurasi Blob hilang, tetapi respons masih ada. Data tidak direset.');
    }
    const candidate = { version: 1, secret: randomBytes(32).toString('hex') };
    try {
      await createOnce(configurationPath, candidate);
      return candidate.secret;
    } catch (error) {
      // Another function may have created the same immutable configuration first.
      const winner = await readJson(configurationPath);
      if (!winner) throw error;
      return validateConfiguration(winner);
    }
  }

  function getSecret() {
    if (!secretPromise) {
      secretPromise = initializeSecret().catch((error) => {
        secretPromise = undefined;
        throw error;
      });
    }
    return secretPromise;
  }

  async function responseKey(identity) {
    return createHmac('sha256', await getSecret())
      .update(identity)
      .digest('hex');
  }

  async function confirmedKeys() {
    const keys = new Set();
    const seenCursors = new Set();
    let cursor;
    do {
      const page = await client.list({
        ...options(),
        prefix: responsePrefix,
        limit: 1000,
        ...(cursor ? { cursor } : {}),
      });
      for (const blob of page.blobs) {
        const name = blob.pathname.slice(responsePrefix.length);
        if (blob.pathname.startsWith(responsePrefix) && /^[a-f0-9]{64}\.json$/.test(name)) {
          keys.add(name.slice(0, -5));
        }
      }
      if (!page.hasMore) return keys;
      if (!page.cursor || seenCursors.has(page.cursor))
        throw new Error('Pagination Blob tidak valid.');
      seenCursors.add(page.cursor);
      cursor = page.cursor;
    } while (cursor);
    return keys;
  }

  async function hasConfirmation(key) {
    const record = await readJson(`${responsePrefix}${key}.json`);
    if (!record) return false;
    if (record.version !== 1 || record.attendance !== 'attending') {
      throw new Error('File konfirmasi Blob tidak valid.');
    }
    return true;
  }

  async function snapshot(key, confirmed = false) {
    const keys = await confirmedKeys();
    if (key && (confirmed || (!keys.has(key) && (await hasConfirmation(key))))) keys.add(key);
    return {
      counts: { attending: keys.size, declined: 0 },
      attendance: keys.has(key) ? 'attending' : null,
    };
  }

  return {
    async read(identity = null) {
      return snapshot(identity ? await responseKey(identity) : null);
    },
    async save(identity, attendance) {
      if (attendance !== 'attending') throw new TypeError('Hanya konfirmasi hadir yang didukung.');
      const key = await responseKey(identity);
      if (!(await hasConfirmation(key))) {
        try {
          await createOnce(`${responsePrefix}${key}.json`, {
            version: 1,
            attendance: 'attending',
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          // A duplicate request (or a response lost after upload) is successful only
          // when the immutable confirmation really exists in origin storage.
          if (!(await hasConfirmation(key))) throw error;
        }
      }
      return snapshot(key, true);
    },
  };
}
