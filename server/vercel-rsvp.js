import { createBlobRsvpStore } from './blob-rsvp-store.js';
import { createRsvpHandler, sendJson } from './rsvp-api.js';

export function createVercelRsvpHandler({ env = process.env, client } = {}) {
  let handler;
  return async (request, response) => {
    try {
      if (!handler) {
        if (!env.BLOB_READ_WRITE_TOKEN && !(env.BLOB_STORE_ID && env.VERCEL_OIDC_TOKEN)) {
          console.error('RSVP: hubungkan Private Blob store ke project Vercel.');
          return sendJson(response, 503, {
            code: 'RSVP_STORAGE_NOT_CONFIGURED',
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
          allowedAttendance: ['attending'],
          storageErrorStatus: 503,
        });
      }
      return await handler(request, response, () =>
        sendJson(response, 404, { error: 'Endpoint tidak ditemukan.' }),
      );
    } catch (error) {
      console.error('RSVP configuration error:', error.message);
      return sendJson(response, 503, {
        code: 'RSVP_CONFIGURATION_INVALID',
        error: 'Konfirmasi kehadiran belum tersedia. Silakan coba lagi nanti.',
      });
    }
  };
}
