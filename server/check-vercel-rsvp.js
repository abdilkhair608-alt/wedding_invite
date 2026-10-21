// Read-only deployment check: never submits a guest confirmation.
const input = process.argv[2];

try {
  if (!input) throw new Error('Gunakan: npm.cmd run check:vercel -- https://DOMAIN.vercel.app');
  const base = new URL(input);
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('Gunakan URL website HTTP/HTTPS tanpa kredensial.');
  }
  const url = new URL('/api/rsvp', base);
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => null);
  console.log(`${url.origin}/api/rsvp: HTTP ${response.status}`);
  if (!response.ok) {
    const advice = {
      RSVP_STORAGE_NOT_CONFIGURED:
        'Hubungkan Private Blob ke project, aktifkan Production, lalu redeploy.',
      RSVP_CONFIGURATION_INVALID: 'Periksa RSVP_BLOB_PREFIX dan Function Logs, lalu redeploy.',
      RSVP_STORAGE_UNAVAILABLE:
        'Periksa akses Private Blob, token, kuota, dan Function Logs. Jangan hapus data RSVP.',
    };
    throw new Error(
      advice[data?.code] ||
        (response.status === 503
          ? 'Periksa koneksi Private Blob dan environment Production, lalu redeploy. Lihat Function Logs untuk penyebab pasti.'
          : response.status === 404
            ? 'Deploy source project dari folder utama; pastikan api/rsvp.js ikut diunggah.'
            : 'Periksa Deployment Protection dan Function Logs di Vercel.'),
    );
  }
  if (!Number.isSafeInteger(data?.counts?.attending) || data.counts.attending < 0) {
    throw new Error(
      'Endpoint tidak mengirim data RSVP yang valid. Periksa route API dan deployment.',
    );
  }
  console.log(`API dapat dibaca. Jumlah hadir: ${data.counts.attending}.`);
  console.log('Pemeriksaan ini tidak mengirim konfirmasi. Uji tombol melalui halaman undangan.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
