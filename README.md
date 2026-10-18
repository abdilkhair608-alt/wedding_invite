# Undangan Pernikahan

Website undangan pernikahan menggunakan React, Vite, dan Tailwind CSS 3.
Desain botanical dengan warna ivory, sage, dan emas lembut, layout responsif,
gambar lokal, hitung mundur resepsi, galeri yang dapat diperbesar, dan
konfirmasi kehadiran dengan penyimpanan file JSON (tanpa database).
Tailwind diproses saat build, sehingga tidak lagi menggunakan CDN JavaScript.

## Menjalankan proyek

Gunakan Node.js 22.12+; proyek ini diuji dengan Node.js 24.

```sh
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite di terminal. Jalankan melalui server Vite,
bukan dengan membuka HTML langsung atau Live Server. Pada PowerShell yang
memblokir npm.ps1, gunakan npm.cmd sebagai pengganti npm.
API RSVP sudah berjalan bersama Vite; tidak perlu menyalakan server kedua.

## Deploy di Vercel

Ikuti [panduan setup Vercel RSVP](docs/vercel-rsvp.md): hubungkan **Private
Vercel Blob** ke project, lalu redeploy kode terbaru. Route `/api/rsvp` berjalan
melalui Vercel Function dan menyimpan satu file privat per IP. Rahasia hash
dibuat otomatis. Kredensial storage tetap berada di server; tidak memakai database.

Tanpa koneksi Blob, halaman dapat tampil tetapi konfirmasi kehadiran belum
tersedia. Deployment Vercel tidak menjalankan `npm start` atau memakai JSON
lokal sebagai penyimpanan permanen.

## Build produksi di server Node.js sendiri

```sh
npm run build
npm start
```

Hasil build tersedia di dist/. `npm start` menyajikan halaman dan API dari
http://127.0.0.1:3000. `npm run preview` juga mendukung API untuk pemeriksaan
lokal, tetapi gunakan `npm start` untuk menjalankan server produksi.
Gunakan npm ci untuk memasang versi dependency yang sama dari package-lock.json.

## Konfirmasi kehadiran dengan file lokal (Node.js sendiri)

- Tombol **Saya akan hadir** menyimpan satu konfirmasi
  per IP ke `.data/rsvp.json`. File dibuat otomatis saat server pertama dijalankan.
- Klik berulang dari IP yang sama tidak menggandakan jumlah. Respons tetap ada
  setelah refresh, menutup browser, atau restart server. Halaman hanya menampilkan
  tombol hadir dan jumlah konfirmasi hadir.
- Pengunjung dengan IP berbeda menambah respons. IP bukan identitas orang:
  beberapa orang di Wi-Fi/IP publik yang sama berbagi satu respons; IP yang
  berubah dapat dihitung sebagai respons baru.
- Jumlah diperbarui setelah menyimpan dan dimuat ulang setiap 30 detik selama
  tab terlihat. Angka tidak dinaikkan sebelum server mengonfirmasi penyimpanan.
- IP disimpan sebagai hash HMAC, bukan alamat IP mentah. File dan kunci hash
  tidak dikirim ke browser; API hanya mengirim jumlah dan pilihan IP peminta.
- Penulisan memakai file sementara, flush ke disk, lalu rename. Salinan
  `.data/rsvp.json.backup` diperbarui setelah penyimpanan. Jika file utama rusak
  saat startup, server mencoba salinan ini; jika keduanya rusak, server gagal
  dengan jelas dan tidak membuat angka nol pengganti.

**Untuk metode file lokal:** jalankan satu proses Node.js dengan
disk/volume permanen. Jangan menghapus folder `.data` saat deploy. Salinan
cadangan di disk yang sama tidak melindungi dari disk hilang, jadi simpan juga
backup eksternal. Jangan menjalankan beberapa replika/proses penulis pada file
yang sama. Hosting statis saja atau filesystem sementara tidak cukup untuk fitur ini.

Variabel opsional ada di `.env.example`; salin menjadi `.env` untuk mengubah
konfigurasi. `RSVP_FILE` dapat menunjuk path absolut pada volume permanen, misalnya
`/var/lib/wedding/rsvp.json`. Simpan file di luar `dist`/`public`. `HOST` dan `PORT`
mengatur alamat server; set `HOST=0.0.0.0` bila diperlukan oleh lingkungan hosting.

Jika menggunakan reverse proxy, isi `TRUSTED_PROXY_IPS` dengan IP socket proxy
yang benar (pisahkan koma). Proxy wajib mengisi/menambahkan IP koneksi asli
ke bagian terakhir `X-Forwarded-For`. Contoh untuk Nginx di mesin yang sama:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-For $remote_addr;
}
```

Gunakan `TRUSTED_PROXY_IPS=127.0.0.1,::1` untuk konfigurasi tersebut dan
batasi port backend agar hanya dapat diakses proxy. Tanpa proxy, biarkan kosong:
header IP dari browser diabaikan dan IP diambil dari koneksi server.

## Memeriksa kode

```sh
npm run check
```

Perintah ini menjalankan ESLint (termasuk import/variabel tidak terpakai dan
React Hooks), pemeriksaan format, pengujian tanggal/peta/countdown/RSVP, dan build.
Gunakan `npm run format` untuk merapikan format setelah mengedit kode.

## Struktur

```text
index.html                 Entry HTML dan Google Fonts
src/
  main.jsx                 Entry React dan stylesheet
  App.jsx                  Susunan bagian halaman
  components/
    Navbar.jsx             Navigasi desktop dan menu ponsel
    MobileMenu.jsx         Menu modal dengan latar blur dan navigasi keyboard
    Hero.jsx               Sampul undangan
    Quote.jsx              Kutipan
    Couple.jsx             Identitas mempelai
    Events.jsx             Jadwal, alamat, dan tautan Google Maps
    Rsvp.jsx               Tombol konfirmasi dan jumlah respons
    Countdown.jsx          Hitung mundur resepsi (WIB)
    Gallery.jsx            Galeri dengan dialog pembesaran gambar
    Lightbox.jsx           Dialog gambar, scroll lock, dan pemulihan fokus
    Icon.jsx               Ikon SVG bersama
    Footer.jsx             Penutup
  hooks/
    useScrollReveal.js     IntersectionObserver dengan cleanup
    useModalDialog.js      Lifecycle dialog, scroll lock, dan pemulihan fokus
    useRsvp.js             Request API, polling, dan status konfirmasi
  data/
    wedding.js             Sumber tanggal, waktu, alamat, dan peta acara
  utils/
    countdown.js           Perhitungan hitung mundur
  styles/
    index.css              Tailwind, desain, dan breakpoint responsif
  assets/                  Gambar pernikahan lokal dan catatan sumber
tailwind.config.js         Font body dan pemindaian kelas
postcss.config.js          Pemrosesan Tailwind dan Autoprefixer
vite.config.js             Konfigurasi Vite
server/
  blob-rsvp-store.js        File JSON privat per IP pada Vercel Blob
  vercel-rsvp.js            Adapter Function, konfigurasi, dan IP platform
  index.js                 Server produksi: dist dan API
  config.js                Lokasi penyimpanan dan proxy tepercaya
  rsvp-api.js              Validasi request dan pengenalan IP
  rsvp-store.js            Penyimpanan JSON dan cadangan
  vite-rsvp.js             Integrasi API untuk dev/preview
tests/countdown.test.js    Pengujian countdown, zona waktu, dan peta
tests/rsvp.test.js         Pengujian API, IP, persistensi, dan request bersamaan
tests/vercel-rsvp.test.js  Pengujian Blob dan adapter Function dengan simulasi
api/rsvp.js                Endpoint serverless Vercel
vercel.json                Konfigurasi deploy Vercel
docs/vercel-rsvp.md         Langkah aktivasi storage dan pemeriksaan deploy
eslint.config.js           Aturan pemeriksaan JavaScript/React
.prettierrc.json           Format kode bersama
```

Ubah konten melalui komponen terkait. Tanggal, waktu, dan alamat berada di
`src/data/wedding.js`; sampul, navigasi, jadwal, peta, dan countdown memakai
data yang sama. Ubah warna dan gaya visual melalui `src/styles/index.css`.
Tiga gambar dekorasi dibuat dengan AI dan disimpan di src/assets/. Gambar ini
adalah ilustrasi, bukan foto mempelai atau dokumentasi lokasi acara sebenarnya.
Ganti gambar di Couple.jsx dan Gallery.jsx untuk memakai foto pribadi.
Catatan aset dan prompt ada di src/assets/README.md. Font Google memerlukan
internet dan memiliki fallback lokal. Hitung mundur mengacu pada resepsi
9 November 2026 pukul 10.00 WIB, dan berhenti pada nol setelah acara dimulai.
Galeri mendukung tombol Escape, penguncian scroll, dan pemulihan fokus.
Menu ponsel juga memakai dialog modal: halaman di belakangnya diburamkan,
scroll dikunci, dan fokus keyboard tetap di menu. Menu tertutup ketika
memilih tautan, menekan Escape/tombol X, mengetuk backdrop, atau beralih
ke lebar desktop. Tampilan ponsel memakai kartu satu kolom, gambar galeri
yang lebih lapang, serta jarak aman untuk perangkat dengan notch.
Animasi mengikuti preferensi reduced motion. Timer berhenti setelah acara
dimulai. HTML dan simulasi RSVP lama telah dihapus; konfirmasi kini disimpan
oleh server. Folder `.qa`, `.npm-cache`, `node_modules`, `dist`, dan `.data`
diabaikan Git. Folder `.data` adalah data pengguna dan harus dipertahankan.
