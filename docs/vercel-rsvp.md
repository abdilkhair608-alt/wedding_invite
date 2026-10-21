# Setup RSVP di Vercel tanpa database

Frontend tetap React + Vite. Route `api/rsvp.js` dijalankan sebagai Vercel
Function dan menyimpan konfirmasi sebagai file JSON di **Private Vercel Blob**.
Tidak diperlukan database atau kunci hash buatan sendiri.

## 1. Hubungkan Private Blob

1. Buka [dashboard Vercel](https://vercel.com/dashboard), lalu pilih project
   yang memiliki domain undangan Anda (misalnya `ai-cici.vercel.app`).
2. Buka tab **Storage**, pilih **Create Database**, lalu **Blob**.
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

Pemeriksaan dari terminal (tidak mengirim konfirmasi tamu):

```powershell
npm.cmd run check:vercel -- https://ai-cici.vercel.app
```

Perintah akan gagal dengan petunjuk perbaikan jika API belum tersedia.
Respons error versi terbaru menyertakan kode berikut:

| Kode                          | Penyebab dan tindakan                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `RSVP_STORAGE_NOT_CONFIGURED` | Function tidak menerima kredensial Blob. Hubungkan Private Blob ke **project yang benar**, aktifkan Production, lalu redeploy.               |
| `RSVP_CONFIGURATION_INVALID`  | Konfigurasi tidak valid. Kosongkan `RSVP_BLOB_PREFIX` jika belum pernah dipakai, atau gunakan prefix lama yang valid; periksa Function Logs. |
| `RSVP_STORAGE_UNAVAILABLE`    | Blob tidak dapat dibaca/ditulis. Periksa token, akses Private, kuota, dan Function Logs; jangan hapus data.                                  |

Deploy **source project dari folder utama** yang berisi `package.json`,
`api/`, `server/`, dan `vercel.json`. Mengunggah folder `dist` saja hanya
mengunggah halaman statis; API penyimpanan tidak ikut tersedia. Jangan memakai
file lokal atau `/tmp` sebagai pengganti Blob di Vercel, karena data tidak
bertahan secara andal antar Function/redeploy.

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
bertambah dan tombol terpilih. Refresh halaman: jumlah serta konfirmasi browser
yang sama tetap ada. Klik ulang dari browser yang sama tidak menambah jumlah.

- **404:** deployment belum memuat `api/rsvp.js`, atau Anda membuka URL versi lama.
- **503:** periksa kode error di atas dan Function Logs, kemudian redeploy
  setelah memperbaiki koneksi storage/environment. Deployment lama mungkin
  belum mengirim kode error.
- **500:** periksa Function Logs untuk akses Blob, store yang tidak Private,
  atau gangguan storage. Jangan menghapus file konfigurasi untuk mencoba
  memperbaiki angka; file tersebut menyimpan identitas hash respons.
- **401/login Vercel:** URL Preview dilindungi Deployment Protection. Gunakan
  domain Production yang dapat diakses tamu, atau sesuaikan perlindungan deploy.

## Cara penyimpanan dan pencegahan hitung ganda

- Konfigurasi privat dibuat sekali di `wedding-invite/production/config.json`.
- Setiap ID browser memiliki satu nama file HMAC pada folder `responses/`.
  ID mentah tidak ditulis ke file. ID dibuat otomatis dan disimpan di localStorage. Rahasia hash hanya tersimpan di konfigurasi privat.
- File konfirmasi dibuat dengan nama tetap dan `allowOverwrite: false`.
  Permintaan bersamaan dari ID browser sama tetap menghasilkan satu file. ID browser berbeda
  menghasilkan file berbeda, sehingga tidak berebut memperbarui satu counter.
- Jumlah dihitung dari semua halaman daftar file konfirmasi. Tidak ada satu
  angka counter bersama yang dapat tertimpa oleh request lain.
- Pembacaan isi memakai `useCache: false`; hasil API memakai `Cache-Control:
no-store`. File/key/URL Blob tidak dikirim ke pengunjung.
- Respons yang telah disimpan tetap tersedia saat Function berhenti, cold start,
  dan redeploy, selama Blob store beserta filenya dipertahankan.
- Jangan menghapus `config.json`, folder `responses`, atau Blob store. Unduh
  cadangan melalui dashboard untuk perlindungan dari penghapusan tidak sengaja.
- HP dan laptop di Wi-Fi yang sama dihitung terpisah. Perubahan IP tidak membuat
  respons baru jika ID browser tetap sama.
- ID berlaku per browser dan domain. Menghapus data situs, mode privat, browser
  lain, atau domain lain dapat menghasilkan ID baru. Bagikan satu domain Production
  yang tetap. Metode ini tidak menjamin satu orang hanya dihitung sekali.
- Respons lama berbasis IP tetap masuk total, tetapi tidak dapat dipasangkan
  otomatis ke ID browser baru. Pengunjung lama dapat mengonfirmasi lagi sekali.
- API GET tanpa header ID hanya menampilkan total dengan attendance null. Situs
  mengirim header X-Rsvp-Browser-Id untuk membaca status dan mengirim konfirmasi.
  POST tanpa ID UUID v4 yang valid ditolak dengan 400.

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
