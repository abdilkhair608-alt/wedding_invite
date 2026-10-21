import { createRsvpStore } from './rsvp-store.js';

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function getBrowserIdentity(request) {
  const id = request.headers['x-rsvp-browser-id'];
  if (id === undefined && request.method !== 'POST') return null;
  if (
    typeof id !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)
  ) {
    throw new RequestError(400, 'ID browser tidak valid. Muat ulang halaman undangan.');
  }
  return `browser:${id}`;
}

export function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin, X-Rsvp-Browser-Id',
  });
  response.end(JSON.stringify(payload));
}

async function readAttendance(request, allowedAttendance) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new RequestError(415, 'Format pengiriman harus JSON.');
  }
  if (Number(request.headers['content-length']) > 1024)
    throw new RequestError(413, 'Data terlalu besar.');
  let body;
  if (request.body !== undefined) {
    // The Vercel Node runtime can parse JSON before invoking this handler.
    if (typeof request.body === 'object' && !Buffer.isBuffer(request.body)) body = request.body;
    else {
      try {
        body = JSON.parse(String(request.body));
      } catch {
        throw new RequestError(400, 'Data konfirmasi tidak valid.');
      }
    }
    if (Buffer.byteLength(JSON.stringify(body) || '') > 1024)
      throw new RequestError(413, 'Data terlalu besar.');
  } else {
    let size = 0;
    const chunks = [];
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 1024) throw new RequestError(413, 'Data terlalu besar.');
      chunks.push(chunk);
    }
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new RequestError(400, 'Data konfirmasi tidak valid.');
    }
  }
  if (!body || !allowedAttendance.includes(body.attendance)) {
    throw new RequestError(400, 'Pilihan konfirmasi tidak valid.');
  }
  return body.attendance;
}

export function createRsvpHandler({
  filePath,
  store,
  allowedAttendance = ['attending', 'declined'],
  storageErrorStatus = 500,
}) {
  const storage = store ?? createRsvpStore(filePath);

  return async (request, response, next) => {
    if (!/^\/api\/rsvp\/?$/.test(request.url.split('?')[0])) return next();
    try {
      const identity = getBrowserIdentity(request);
      if (request.method === 'GET') return sendJson(response, 200, await storage.read(identity));
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'GET, POST');
        return sendJson(response, 405, { error: 'Metode tidak didukung.' });
      }
      const origin = request.headers.origin;
      if (origin) {
        let sameHost = false;
        try {
          sameHost = new URL(origin).host === request.headers.host;
        } catch {
          /* Reject invalid origins. */
        }
        if (!sameHost) throw new RequestError(403, 'Kirim konfirmasi melalui halaman undangan.');
      }
      if (request.headers['sec-fetch-site'] === 'cross-site') {
        throw new RequestError(403, 'Kirim konfirmasi melalui halaman undangan.');
      }
      const attendance = await readAttendance(request, allowedAttendance);
      return sendJson(response, 200, await storage.save(identity, attendance));
    } catch (error) {
      if (error instanceof RequestError)
        return sendJson(response, error.status, { error: error.message });
      console.error('RSVP storage error:', error.message);
      return sendJson(response, storageErrorStatus, {
        code: 'RSVP_STORAGE_UNAVAILABLE',
        error: 'Konfirmasi belum dapat disimpan. Silakan coba lagi.',
      });
    }
  };
}
