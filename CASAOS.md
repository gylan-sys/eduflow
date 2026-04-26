# Panduan Instalasi di CasaOS

Aplikasi **Rumah Inklusif Adiba** dapat diinstal dengan mudah di CasaOS menggunakan Docker Compose.

## Langkah-langkah:

1. **Masuk ke CasaOS**: Buka dashboard CasaOS Anda di browser.
2. **Tambah Aplikasi (App Store)**:
   - Klik tombol **"App Store"**.
   - Klik **"Custom Install"** (tombol di kanan atas).
   - Klik tombol **"Import"** (ikon kertas dengan tanda panah).
3. **Masukkan Konfigurasi**:
   - Salin dan tempel (copy-paste) isi dari file `docker-compose.yml` yang sudah saya siapkan ke dalam kotak teks yang muncul.
   - Klik **"Submit"**.
4. **Konfigurasi Tambahan (Opsional)**:
   - **App Name**: Rumah Inklusif Adiba
   - **Icon URL**: (Anda bisa menggunakan URL logo aplikasi Anda)
   - **Security**: Pastikan untuk mengubah `JWT_SECRET` menjadi sesuatu yang unik dan rahasia.
5. **Klik Install**: Tunggu hingga proses build dan instalasi selesai.
6. **Akses Aplikasi**: Aplikasi akan muncul di dashboard CasaOS Anda pada Port 3000.

## Catatan Penting:
- **Penyimpanan Data**: Data akan disimpan di folder `/data` dan `/uploads` di dalam direktori aplikasi Anda di CasaOS agar tidak hilang saat aplikasi diperbarui.
- **Node Version**: Dockerfile ini menggunakan Node 22 yang mendukung fitur terbaru.

Selamat menggunakan!
