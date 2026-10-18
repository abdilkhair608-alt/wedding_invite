import { createBlobRsvpStore } from './blob-rsvp-store.js';
import { createRsvpHandler, getClientIp, normalizeIp, sendJson } from './rsvp-api.js';

export function getVercelClientIp(request, env) {
  if (env.VERCEL !== '1') return getClientIp(request);
  const header = request.headers['x-vercel-forwarded-for'] ?? request.headers['x-forwarded-for'];
  const ip = typeof header === 'string' ? normalizeIp(header.split(',')[0]) : null;
  if (!ip) throw new Error('Vercel tidak memberikan IP koneksi yang valid.');
  return ip;
}

export function createVercelRsvpHandler({ env = process.env, client } = {}) {
  let handler;
  return async (request, response) => {
    try {
      if (!handler) {
        if (!env.BLOB_READ_WRITE_TOKEN && !(env.BLOB_STORE_ID && env.VERCEL_OIDC_TOKEN)) {
          console.error('RSVP: hubungkan Private Blob store ke project Vercel.');
          return sendJson(response, 503, {
            error: 'Konfirmasi kehadiran belum tersedia. Silakan coba lagi nanti.',
          });
        }
        const environment = env.VERCEL_ENV === 'production' ? 'production' : 'preview';
        const store = createBlobRsvpStore({
          prefix: env.RSVP_BLOB_PREFIX || `wedding-invite/${environment}`,
          token: env.BLOB_READ_WRITE_TOKEN,
          storeId: env.BLOB_STORE_ID,
          client,
        });
        handler = createRsvpHandler({
          store,
          resolveIp: (req) => getVercelClientIp(req, env),
          allowedAttendance: ['attending'],
        });
      }
      return await handler(request, response, () =>
        sendJson(response, 404, { error: 'Endpoint tidak ditemukan.' }),
      );
    } catch (error) {
      console.error('RSVP configuration error:', error.message);
      return sendJson(response, 503, {
        error: 'Konfirmasi kehadiran belum tersedia. Silakan coba lagi nanti.',
      });
    }
  };
}
