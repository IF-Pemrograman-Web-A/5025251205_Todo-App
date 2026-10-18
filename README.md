# TODO SASKARA

Aplikasi Todo List kolaboratif berbasis PHP dan MySQL. Daftar **Personal** terpisah per sesi browser, sedangkan daftar **Shared** disimpan di database yang sama dan terlihat oleh semua pengguna aplikasi.

## Fitur

- Menu Personal dan Shared dengan data tersimpan permanen di MySQL.
- CRUD tugas: tambah, lihat, ubah, tandai selesai, dan hapus.
- Nama pengguna untuk menandai pembuat tugas Shared.
- Deskripsi, waktu pengingat, dan unggah lampiran foto.
- Notifikasi pengingat tugas pada browser setelah izin notifikasi diaktifkan.
- Perlindungan CSRF, query PDO terparameterisasi, validasi unggahan berdasarkan MIME, dan nama berkas acak.
- Tema terang/gelap.

## Menjalankan aplikasi

1. Siapkan PHP 8.1+ dengan ekstensi `PDO_MYSQL` dan `fileinfo`, serta MySQL/MariaDB.
2. Impor [`data.sql`](./data.sql) melalui phpMyAdmin atau jalankan `mysql -u root -p < data.sql`. Skrip ini membuat database `todo_app`, tabel, dan contoh tugas Shared.
3. Sesuaikan koneksi di `config.php` melalui environment variables bila perlu:
   - `TODO_DB_HOST` (default `127.0.0.1`)
   - `TODO_DB_NAME` (default `todo_app`)
   - `TODO_DB_USER` (default `root`)
   - `TODO_DB_PASSWORD` (default kosong)
4. Jalankan folder ini melalui Apache/PHP (misalnya `http://localhost/todo-saskara/`) atau gunakan server PHP bawaan:

   ```sh
   php -S 127.0.0.1:8000
   ```

5. Buka `http://127.0.0.1:8000` dan gunakan menu **Personal** atau **Shared**.

Folder `uploads/` dibuat otomatis saat foto pertama diunggah. Pastikan PHP/web server memiliki izin tulis pada folder proyek.

## Catatan kolaborasi

Semua browser yang terhubung ke database yang sama dapat melihat dan mengelola tugas Shared. Personal menggunakan identitas sesi PHP, bukan sistem akun. Untuk penggunaan organisasi sungguhan, tambahkan autentikasi dan kontrol akses akun; jangan mengekspos database server langsung ke internet.

## Identitas

- Nama: I Made Saskara Bawa
- NRP: 5025251205
