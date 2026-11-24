# SIKOBA — Full MySQL / PHP (XAMPP)

Paket ini menghubungkan fitur aplikasi ke MySQL melalui PHP API dan mempertahankan HTML/CSS tampilan proyek.

## Instalasi
1. Backup folder dan database SIKOBA sebelumnya.
2. Ekstrak folder `SIKOBA_Web_Database` ke `C:\xampp\htdocs\`.
3. Jalankan Apache dan MySQL di XAMPP.
4. Di phpMyAdmin pilih database `sikoba`, lalu Import `database.sql`.
5. Buka `http://localhost/SIKOBA_Web_Database/` (sesuaikan nama folder jika berbeda).

## Tabel database
- `users`: registrasi, login, dan profil akun (password disimpan dengan password_hash).
- `obat`: master obat dan stok.
- `transaksi`: transaksi stok masuk/keluar dan riwayat.
- `kategori_obat`: kategori obat yang digunakan.
- `notifikasi`: notifikasi stok minimum dan kedaluwarsa yang dihitung dari data obat.
- `petugas`: salinan profil petugas untuk kompatibilitas data sebelumnya.
- `app_state`: preferensi/data pendukung aplikasi lama dan kompatibilitas migrasi.

## Fitur yang disinkronkan
- Login, registrasi, dan logout melalui session PHP.
- Tambah, edit, hapus obat ke tabel `obat`.
- Stok masuk dan stok keluar memperbarui stok obat serta menyimpan riwayat pada `transaksi`.
- Dashboard, filter kontrol kedaluwarsa, notifikasi, dan laporan dihitung dari data MySQL yang dimuat.
- Profil disimpan ke tabel `users` dan `petugas`.
- Kategori dan notifikasi disinkronkan ke tabel khusus.

Akun demo otomatis dibuat saat API pertama kali dijalankan:
- Username: `petugas`
- Password: `sikoba123`

## Catatan penting
- Jalankan melalui Apache/XAMPP, bukan Live Server atau membuka `index.html` langsung.
- Jika MySQL menggunakan password, ubah `$password` di bagian atas `api.php`.
- GitHub Pages tidak dapat menjalankan PHP/MySQL; untuk akses online dibutuhkan hosting yang mendukung PHP dan MySQL.
- Backup database sebelum impor atau mengganti file. Jangan hapus database lama.


## Fitur baru: Stok Opname

Fitur **Stok Opname** ditambahkan tanpa menghapus atau mengganti menu dan alur fitur lama.

Cara menggunakan:
1. Login ke aplikasi.
2. Pilih menu **Stok Opname** pada navigasi.
3. Klik **Buat Stok Opname**.
4. Isi tanggal dan keterangan opname.
5. Periksa kolom stok sistem, lalu masukkan hasil hitung fisik pada setiap obat.
6. Kolom selisih akan dihitung otomatis (stok fisik dikurangi stok sistem).
7. Klik **Simpan & Sesuaikan Stok**. Stok pada master obat akan diperbarui mengikuti hasil hitung fisik.
8. Riwayat tersimpan dan dapat dibuka melalui tombol **Detail**.

### Database stok opname
Dua tabel baru ditambahkan:
- `stok_opname`: menyimpan nomor, tanggal, keterangan, jumlah obat, total selisih, dan status opname.
- `detail_stok_opname`: menyimpan stok sistem sebelum penyesuaian, stok fisik, dan selisih untuk setiap obat.

Proses penyimpanan menggunakan transaksi database. Jika proses gagal, perubahan dibatalkan agar stok tidak berubah sebagian. Riwayat opname terpisah dari transaksi stok masuk/keluar sehingga laporan transaksi lama tidak tercampur.

### Pembaruan dari versi sebelumnya
- Jika database `sikoba` sudah digunakan, **jangan hapus database lama**.
- Jalankan file aplikasi yang sudah diperbarui. `api.php` akan membuat kedua tabel opname secara otomatis saat API pertama kali dijalankan.
- Alternatif: jalankan bagian SQL **Tabel tambahan untuk fitur Stok Opname** di bagian bawah `database.sql` melalui phpMyAdmin.
- Backup database dan folder aplikasi sebelum mengganti file.

### Catatan
Stok fisik yang disimpan menjadi stok terbaru pada tabel `obat`. Nilai stok sistem sebelum penyesuaian tetap disimpan pada detail opname sebagai jejak audit.
