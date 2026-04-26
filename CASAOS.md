# Panduan Instalasi di CasaOS

Aplikasi **Rumah Inklusif Adiba** dapat diinstal dengan mudah di CasaOS menggunakan Docker Compose.

## Cara Instalasi via Terminal:

Jika Anda sudah melakukan git clone dari GitHub ke folder di CasaOS Anda:

1. **Masuk ke folder proyek**:
   ```bash
   cd /path/ke/folder/rumah-inklusif-adiba
   ```
2. **Jalankan Docker Compose**:
   ```bash
   docker compose up -d --build
   ```
3. **Selesai**: Aplikasi akan berjalan dan bisa diakses di `http://ip-casaos-anda:3001`.

## Catatan Port:
Karena port 3000 sudah digunakan, aplikasi ini sekarang menggunakan port **3001**. Anda bisa mengubahnya di file `docker-compose.yml` pada bagian `ports`.

## Catatan Penting:
- **Penyimpanan Data**: Data akan disimpan di folder `/data` dan `/uploads` di dalam direktori aplikasi Anda di CasaOS agar tidak hilang saat aplikasi diperbarui.
- **Node Version**: Dockerfile ini menggunakan Node 22 yang mendukung fitur terbaru.

Selamat menggunakan!
