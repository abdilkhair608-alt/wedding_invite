import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { createBlobRsvpStore } from '../server/blob-rsvp-store.js';
import { createVercelRsvpHandler } from '../server/vercel-rsvp.js';

function fakeBlob() {
  const files = new Map();
  const calls = [];
  let failWrites = false;
  let failLists = false;
  const wait = () => new Promise((resolve) => setTimeout(resolve, 1));
  return {
    files,
    calls,
    set failWrites(value) {
      failWrites = value;
    },
    set failLists(value) {
      failLists = value;
    },
    client: {
      async get(pathname, options) {
        calls.push({ method: 'get', pathname, options });
        await wait();
        if (!files.has(pathname)) return null;
        const value = files.get(pathname);
        return { statusCode: 200, stream: new Response(value).body };
      },
      async put(pathname, body, options) {
        calls.push({ method: 'put', pathname, options });
        await wait();
        if (failWrites) throw new Error('Blob write unavailable');
        if (files.has(pathname) && !options.allowOverwrite) throw new Error('Blob already exists');
        files.set(pathname, body);
        return { pathname };
      },
      async list(options) {
        calls.push({ method: 'list', options });
        await wait();
        if (failLists) throw new Error('Blob list unavailable');
        const all = [...files.keys()].filter((name) => name.startsWith(options.prefix)).sort();
        const start = Number(options.cursor || 0);
        const limit = Math.min(2, options.limit);
        const next = start + limit;
        return {
          blobs: all.slice(start, next).map((pathname) => ({ pathname })),
          hasMore: next < all.length,
          cursor: next < all.length ? String(next) : undefined,
        };
      },
    },
  };
}

function store(blob, prefix = 'tests/production') {
  return createBlobRsvpStore({ prefix, client: blob.client });
}

test('Blob stores only private immutable files and does not expose raw IPs', async () => {
  const blob = fakeBlob();
  const storage = store(blob);
  assert.equal((await storage.read('203.0.113.1')).counts.attending, 0);
  assert.equal((await storage.save('203.0.113.1', 'attending')).counts.attending, 1);
  assert.equal((await storage.save('203.0.113.1', 'attending')).counts.attending, 1);
  assert.equal(blob.files.size, 2);
  assert.ok([...blob.files].every(([name, body]) => !`${name}${body}`.includes('203.0.113.1')));
  assert.ok(
    blob.calls
      .filter((call) => call.method === 'put')
      .every(
        (call) =>
          call.options.access === 'private' &&
          call.options.allowOverwrite === false &&
          call.options.addRandomSuffix === false,
      ),
  );
  assert.ok(
    blob.calls
      .filter((call) => call.method === 'get')
      .every((call) => call.options.useCache === false),
  );
});

test('concurrent Vercel instances share one secret and count each IP once', async () => {
  const blob = fakeBlob();
  const instances = Array.from({ length: 10 }, () => store(blob));
  await Promise.all(instances.map((instance) => instance.save('203.0.113.1', 'attending')));
  assert.equal((await store(blob).read('203.0.113.1')).counts.attending, 1);
  await Promise.all(
    instances.map((instance, index) => instance.save(`203.0.113.${index + 2}`, 'attending')),
  );
  const result = await store(blob).read('203.0.113.1');
  assert.deepEqual(result, { counts: { attending: 11, declined: 0 }, attendance: 'attending' });
  assert.equal(blob.files.size, 12);
});

test('pagination includes all confirmations and new function instances preserve responses', async () => {
  const blob = fakeBlob();
  const first = store(blob);
  for (let i = 1; i <= 7; i += 1) await first.save(`203.0.113.${i}`, 'attending');
  blob.files.set('tests/production/responses/notes.txt', 'not a confirmation');
  assert.equal((await store(blob).read('203.0.113.7')).counts.attending, 7);
  assert.equal((await store(blob).read('203.0.113.7')).attendance, 'attending');
  assert.equal((await store(blob).read('203.0.113.99')).attendance, null);
});

test('production and preview namespaces do not mix confirmation counts', async () => {
  const blob = fakeBlob();
  await store(blob, 'tests/preview').save('203.0.113.1', 'attending');
  assert.equal((await store(blob, 'tests/production').read('203.0.113.1')).counts.attending, 0);
});

test('failed uploads and reads never fabricate successful confirmations or zero counts', async () => {
  const blob = fakeBlob();
  const storage = store(blob);
  await storage.read('203.0.113.1');
  blob.failWrites = true;
  await assert.rejects(storage.save('203.0.113.1', 'attending'), /write unavailable/);
  blob.failWrites = false;
  assert.equal((await storage.read('203.0.113.1')).counts.attending, 0);
  blob.failLists = true;
  await assert.rejects(storage.read('203.0.113.1'), /list unavailable/);
});

test('missing or damaged config fails without regenerating IP keys for existing responses', async () => {
  const blob = fakeBlob();
  await store(blob).save('203.0.113.1', 'attending');
  blob.files.delete('tests/production/config.json');
  await assert.rejects(store(blob).read('203.0.113.1'), /respons masih ada/);
  blob.files.set('tests/production/config.json', JSON.stringify({ version: 1, secret: 'broken' }));
  await assert.rejects(store(blob).read('203.0.113.1'), /Data tidak direset/);
});

test('Vercel adapter awaits Blob writes and supports bodies pre-parsed by the runtime', async (t) => {
  const blob = fakeBlob();
  const handler = createVercelRsvpHandler({
    env: { VERCEL: '1', VERCEL_ENV: 'production', BLOB_READ_WRITE_TOKEN: 'fake-test-token' },
    client: blob.client,
  });
  const server = createServer(async (request, response) => {
    if (request.method === 'POST') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      request.body = JSON.parse(Buffer.concat(chunks).toString());
    }
    await handler(request, response);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/rsvp`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Rsvp-Browser-Id': '00000000-0000-4000-8000-000000000001',
    'X-Vercel-Forwarded-For': '203.0.113.1',
  };
  const save = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attendance: 'attending' }),
  });
  assert.equal(save.status, 200);
  assert.equal((await save.json()).counts.attending, 1);
  const fresh = await fetch(url, { headers });
  assert.equal((await fresh.json()).attendance, 'attending');
  const otherBrowser = { ...headers, 'X-Rsvp-Browser-Id': '00000000-0000-4000-8000-000000000002' };
  const other = await fetch(url, {
    method: 'POST',
    headers: otherBrowser,
    body: JSON.stringify({ attendance: 'attending' }),
  });
  assert.equal((await other.json()).counts.attending, 2);
  const retry = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'X-Vercel-Forwarded-For': '198.51.100.8' },
    body: JSON.stringify({ attendance: 'attending' }),
  });
  assert.equal((await retry.json()).counts.attending, 2);
  const cold = createVercelRsvpHandler({
    env: { BLOB_READ_WRITE_TOKEN: 'fake-test-token', VERCEL_ENV: 'production' },
    client: blob.client,
  });
  const legacy = store(blob, 'wedding-invite/production');
  await legacy.save('203.0.113.99', 'attending');
  let result;
  await cold(
    {
      url: '/api/rsvp',
      method: 'GET',
      headers: { 'x-rsvp-browser-id': headers['X-Rsvp-Browser-Id'] },
    },
    {
      writeHead(status) {
        assert.equal(status, 200);
      },
      end(body) {
        result = JSON.parse(body);
      },
    },
  );
  assert.deepEqual(result, { counts: { attending: 3, declined: 0 }, attendance: 'attending' });
  const invalid = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ attendance: 'declined' }),
  });
  assert.equal(invalid.status, 400);
});

test('an unconnected Blob store returns 503 without creating a local counter', async (t) => {
  t.mock.method(console, 'error', () => {});
  const handler = createVercelRsvpHandler({ env: {} });
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/rsvp`);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json();
  assert.equal(result.counts, undefined);
  assert.equal(result.code, 'RSVP_STORAGE_NOT_CONFIGURED');
  assert.match(result.error, /belum tersedia/);
});

async function invoke(handler, url = '/api/rsvp') {
  let result;
  await handler(
    { url, method: 'GET', headers: {} },
    {
      writeHead(status, headers) {
        result = { status, headers };
      },
      end(body) {
        result.body = JSON.parse(body);
      },
    },
  );
  return result;
}

test('Vercel reports invalid configuration separately without exposing credentials', async (t) => {
  t.mock.method(console, 'error', () => {});
  const result = await invoke(
    createVercelRsvpHandler({
      env: { BLOB_READ_WRITE_TOKEN: 'secret-test-token', RSVP_BLOB_PREFIX: '../invalid' },
    }),
  );
  assert.equal(result.status, 503);
  assert.equal(result.body.code, 'RSVP_CONFIGURATION_INVALID');
  assert.ok(!JSON.stringify(result).includes('secret-test-token'));
});

test('Blob outages return retryable 503 and recover on the same warm function', async (t) => {
  t.mock.method(console, 'error', () => {});
  const blob = fakeBlob();
  const handler = createVercelRsvpHandler({
    env: { BLOB_READ_WRITE_TOKEN: 'fake-test-token' },
    client: blob.client,
  });
  blob.failLists = true;
  const failed = await invoke(handler);
  assert.equal(failed.status, 503);
  assert.equal(failed.body.code, 'RSVP_STORAGE_UNAVAILABLE');
  assert.equal(failed.body.counts, undefined);
  blob.failLists = false;
  const recovered = await invoke(handler, '/api/rsvp/?refresh=1');
  assert.equal(recovered.status, 200);
  assert.equal(recovered.body.counts.attending, 0);
});

test('Vercel accepts OIDC storage credentials and forwards the connected store ID', async () => {
  const blob = fakeBlob();
  const result = await invoke(
    createVercelRsvpHandler({
      env: { BLOB_STORE_ID: 'store-test', VERCEL_OIDC_TOKEN: 'test-oidc-token' },
      client: blob.client,
    }),
  );
  assert.equal(result.status, 200);
  assert.equal(blob.calls[0].options.storeId, 'store-test');
  assert.equal(blob.calls[0].options.token, undefined);
});
