# Setup RSVP di Vercel tanpa database

Frontend tetap React + Vite. Route `api/rsvp.js` dijalankan sebagai Vercel
Function dan menyimpan konfirmasi sebagai file JSON di **Private Vercel Blob**.
Tidak diperlukan database atau kunci hash buatan sendiri.

## 1. Hubungkan Private Blob

1. Buka project **wedding-invite** pada [dashboard Vercel](https://vercel.com/abdil1/wedding-invite).
2. Buka tab **Storage**, pilih **Create Storage**, lalu **Blob**.
3. Pilih akses **Private** dan beri nama, misalnya `wedding-rsvp`.
4. Hubungkan store ke project tersebut. Aktifkan environment **Production**
   dan **Preview**.
5. Pada Settings → Environment Variables, pastikan koneksi menyediakan
   `BLOB_READ_WRITE_TOKEN`, atau kredensial OIDC (`BLOB_STORE_ID` dan token
   OIDC yang diterbitkan Vercel). Kredensial ini hanya digunakan server.

Jangan menyalin token ke chat, GitHub, atau variabel berawalan `VITE_`.
Menyalin `.env.example` di komputer tidak mengisi environment Vercel;
koneksi storage harus dilakukan di dashboard project.

Panduan resmi: [Vercel Blob SDK — Getting started](https://vercel.com/docs/vercel-blob/using-blob-sdk#getting-started).

## 2. Deploy kode terbaru

- Framework Preset: **Vite**.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Konfigurasi `vercel.json` dan route `api/rsvp.js` sudah tersedia.
- Setelah menghubungkan storage, lakukan **Redeploy** untuk deployment terbaru
  agar environment storage masuk ke Function.
- Buka URL dari deployment terbaru atau domain Production project. URL dengan
  ID deployment lama tetap menunjuk versi lama.

## 3. Periksa endpoint dan tombol

Buka `https://DOMAIN-TERBARU/api/rsvp` dari browser. Jika siap, hasilnya berupa JSON:

```json
{
  "counts": { "attending": 0, "declined": 0 },
  "attendance": null
}
```

Angka awal bergantung pada konfirmasi yang sudah tersimpan. Field `declined`
selalu nol pada backend Blob dan dipertahankan untuk kompatibilitas client;
halaman hanya menampilkan jumlah hadir.

Klik **Saya akan hadir**. Setelah penyimpanan dikonfirmasi server, jumlah
bertambah dan tombol terpilih. Refresh halaman: jumlah serta konfirmasi IP
yang sama tetap ada. Klik ulang dari IP sama tidak menambah jumlah.

- **404:** deployment belum memuat `api/rsvp.js`, atau Anda membuka URL versi lama.
- **503:** koneksi storage/environment project belum tersedia; periksa
  Function Logs lalu redeploy setelah menghubungkan Blob.
- **500:** periksa Function Logs untuk akses Blob, store yang tidak Private,
  atau gangguan storage. Jangan menghapus file konfigurasi untuk mencoba
  memperbaiki angka; file tersebut menyimpan identitas hash respons.
- **401/login Vercel:** URL Preview dilindungi Deployment Protection. Gunakan
  domain Production yang dapat diakses tamu, atau sesuaikan perlindungan deploy.

## Cara penyimpanan dan pencegahan hitung ganda

- Konfigurasi privat dibuat sekali di `wedding-invite/production/config.json`.
- Setiap IP memiliki satu nama file HMAC pada folder `responses/`. IP mentah
  tidak ditulis ke file. Rahasia hash hanya tersimpan di konfigurasi privat.
- File konfirmasi dibuat dengan nama tetap dan `allowOverwrite: false`.
  Permintaan bersamaan dari IP sama tetap menghasilkan satu file. IP berbeda
  menghasilkan file berbeda, sehingga tidak berebut memperbarui satu counter.
- Jumlah dihitung dari semua halaman daftar file konfirmasi. Tidak ada satu
  angka counter bersama yang dapat tertimpa oleh request lain.
- Pembacaan isi memakai `useCache: false`; hasil API memakai `Cache-Control:
no-store`. File/key/URL Blob tidak dikirim ke pengunjung.
- Respons yang telah disimpan tetap tersedia saat Function berhenti, cold start,
  dan redeploy, selama Blob store beserta filenya dipertahankan.
- Jangan menghapus `config.json`, folder `responses`, atau Blob store. Unduh
  cadangan melalui dashboard untuk perlindungan dari penghapusan tidak sengaja.
- Satu IP publik tidak selalu berarti satu orang: Wi-Fi bersama dapat berbagi
  konfirmasi, dan perubahan IP dapat menghasilkan konfirmasi baru.

Production menggunakan prefix `wedding-invite/production`; Preview menggunakan
`wedding-invite/preview` agar uji coba tidak menambah jumlah tamu Production.
Variabel opsional `RSVP_BLOB_PREFIX` dapat mengubah prefix. Setelah mulai
mengumpulkan konfirmasi, pertahankan prefix tersebut. Jangan menunjuk Preview
ke prefix Production untuk pengujian.

## Development lokal

`npm run dev`, `npm run preview`, dan `npm start` tetap menggunakan JSON lokal
di `.data/rsvp.json`. Data lokal dan Blob tidak dipindahkan secara otomatis.
Pengujian Blob menggunakan client simulasi; tidak memerlukan token asli dan
tidak menulis ke store Production. Perhatikan penggunaan/kuota Blob pada
dashboard; pembacaan daftar file dilakukan saat pengguna memuat atau memperbarui data.
