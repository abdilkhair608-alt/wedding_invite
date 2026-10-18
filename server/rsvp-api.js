import { isIP } from 'node:net';
import { createRsvpStore } from './rsvp-store.js';

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function normalizeIp(value) {
  if (typeof value !== 'string') return null;
  const ip = value.trim().split('%')[0];
  if (isIP(ip) === 4) return ip;
  if (isIP(ip) !== 6) return null;
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  if (!canonical.startsWith('::ffff:')) return canonical;
  const words = canonical
    .slice(7)
    .split(':')
    .map((word) => parseInt(word, 16));
  return [words[0] >> 8, words[0] & 255, words[1] >> 8, words[1] & 255].join('.');
}

export function getClientIp(request, trustedProxyIps = []) {
  const remote = normalizeIp(request.socket.remoteAddress);
  if (!remote) throw new RequestError(400, 'Alamat koneksi tidak dapat dikenali.');
  const forwarded = request.headers['x-forwarded-for'];
  if (trustedProxyIps.includes(remote) && typeof forwarded === 'string') {
    // The nearest trusted proxy must append the real connecting IP to this header.
    const client = normalizeIp(forwarded.split(',').at(-1));
    if (!client) throw new RequestError(400, 'Alamat koneksi tidak valid.');
    return client;
  }
  return remote;
}

export function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
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
  trustedProxyIps = [],
  store,
  resolveIp,
  allowedAttendance = ['attending', 'declined'],
}) {
  const proxies = trustedProxyIps.map((ip) => {
    const normalized = normalizeIp(ip);
    if (!normalized) throw new Error(`IP proxy tidak valid: ${ip}`);
    return normalized;
  });
  const storage = store ?? createRsvpStore(filePath);

  return async (request, response, next) => {
    if (request.url.split('?')[0] !== '/api/rsvp') return next();
    try {
      const ip = resolveIp ? resolveIp(request) : getClientIp(request, proxies);
      if (request.method === 'GET') return sendJson(response, 200, await storage.read(ip));
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
      return sendJson(response, 200, await storage.save(ip, attendance));
    } catch (error) {
      if (error instanceof RequestError)
        return sendJson(response, error.status, { error: error.message });
      console.error('RSVP storage error:', error.message);
      return sendJson(response, 500, {
        error: 'Konfirmasi belum dapat disimpan. Silakan coba lagi.',
      });
    }
  };
}
