# #38: Gunakan S3 privat untuk seluruh file terkelola

Sumber: [Issue #38](https://github.com/ifanferdi/POS-nextjs-express/issues/38). Bagian dari [#12](https://github.com/ifanferdi/POS-nextjs-express/issues/12).

Status pada 18 November 2026: issue terbuka, [PR #39](https://github.com/ifanferdi/POS-nextjs-express/pull/39) terbuka dengan base `api`.

## Kebutuhan

Simpan file produk dan profil yang dikelola aplikasi di bucket S3 privat, lalu berikan akses baca melalui signed GET URL sementara. File yang boleh ditampilkan kepada pengguna tetap tidak boleh dibaca secara anonim.

## Kriteria penerimaan

- [ ] S3 API menjadi satu-satunya backend storage. AWS S3 dan endpoint yang kompatibel dengan S3 didukung; filesystem backend, local mode, dan endpoint local `/public/files` tidak tersedia.
- [ ] Bucket privat menolak anonymous read. Aplikasi tidak memakai fallback ke kredensial bawaan yang diketahui publik.
- [ ] Bucket dan region wajib tersedia saat startup. Static access key dan secret harus disediakan berpasangan. Jika keduanya tidak tersedia, aplikasi memakai AWS credential provider chain; kegagalan chain membuat operasi storage gagal tanpa fallback local.
- [ ] Semua object key yang dipakai operasi storage berada di prefix `products/` atau `profiles/`. Key di luar prefix atau yang mengandung traversal ditolak sebelum operasi storage dan mutasi database terkait.
- [ ] Upload produk multipart dan presigned PUT menulis ke S3. Respons upload memberi object key untuk disimpan client, bukan URL sementara.
- [ ] API membuat signed GET URL baru untuk object key produk dan profil yang sah, dengan masa berlaku dari konfigurasi.
- [ ] URL gambar produk pihak ketiga yang didukung tetap dapat dipakai. URL local API dan URL absolut endpoint S3 tidak diteruskan tanpa signing. `imagePath` profil hanya menerima object key di prefix `profiles/`.
- [ ] HTTP smoke terhadap bucket privat membuktikan signed GET yang sah berhasil. Anonymous read, signature palsu atau diubah, URL malformed atau kedaluwarsa, URL local lama, serta key di luar prefix ditolak.
- [ ] Key tidak sah tidak mengubah object atau record database. URL produk pihak ketiga tetap diteruskan.
- [ ] Acceptance diverifikasi melalui HTTP tanpa unit test.

## Kontrak client

`POST /api/v1/uploads/generate-presign-url` mengembalikan field `key`, `presignUrl`, dan `expiresIn`. Client mengunggah bytes dengan PUT ke `presignUrl`, lalu menyimpan nilai `key` sebagai referensi file. Jangan menyimpan `presignUrl` sebagai `imagePath` atau referensi permanen.

Upload multipart produk melalui `POST /api/v1/products/upload` mengembalikan `message` dan `imagePath`; untuk file terkelola, `imagePath` adalah object key. Object key produk berada di `products/`, sedangkan object key profil berada di `profiles/`.

Respons baca produk dan pengguna menampilkan `imagePath` dan `imageUrl`. Untuk file terkelola, `imagePath` adalah object key yang stabil dan `imageUrl` adalah signed GET URL sementara. Client menampilkan `imageUrl`; setelah URL kedaluwarsa, ambil ulang resource produk atau pengguna terkait agar API memberikan URL baru. Jangan membuat signature di client atau mengandalkan signed URL lama yang disimpan sebelumnya.

Produk boleh tetap memakai URL gambar pihak ketiga yang sudah didukung. Pertahankan referensi eksternal tersebut; jangan pindahkan URL pihak ketiga ke S3 sebagai bagian dari perubahan ini. URL local API dan URL absolut endpoint S3 bukan pengganti object key atau signed GET URL.

Masa berlaku signed URL saat diperiksa adalah `config.storage.expiredTime`, sebesar 3600 detik. Respons upload menyertakan `expiresIn`. Tidak ada environment variable khusus expiry yang tercatat pada tanggal pemeriksaan.

## Cutover dan dampak migrasi

Setelah cutover, client dan deployment tidak dapat bergantung pada `FILESYSTEM=local`, filesystem proyek, atau endpoint `/public/files`. Tidak ada migrasi otomatis untuk file local maupun referensinya. Sebelum memakai API S3-only, atur pemindahan file produk/profil terkelola ke prefix S3 yang sesuai dan ganti referensi database/client dengan object key. Pertahankan URL gambar pihak ketiga pada produk.

Dokumen [#12](012-local-file-urls.md) telah diperbarui: panduan lama yang menyarankan pemilihan mode local atau penggunaan URL file local tidak berlaku setelah cutover. Ikuti kontrak client pada dokumen ini.

## Status dan verifikasi

Issue diperiksa pada 17 November 2026 dan masih terbuka. Build TypeScript berhasil. HTTP smoke terhadap bucket MinIO privat memverifikasi upload PUT dan multipart, GET bertanda tangan untuk produk dan profil, isi file, penolakan akses anonim, signature yang diubah, signature tidak lengkap, URL kedaluwarsa, dan URL local lama. Key traversal dan prefix salah ditolak tanpa perubahan pada imagePath database atau daftar object; URL produk pihak ketiga tetap diteruskan. URL kedaluwarsa dibuat dengan expiry satu detik untuk smoke, bukan dengan expiry API normal.

Pada 18 November 2026, HTTP smoke tambahan memverifikasi URL gambar bertanda tangan pada detail dan daftar order, pembuatan produk tanpa gambar, penghapusan referensi gambar, serta penolakan alias endpoint S3. Snapshot order yang dibuat menyimpan key tanpa `imageUrl`; respons detail dan retry idempoten memperoleh signed URL baru.

Startup tanpa bucket atau region, serta kredensial statis parsial, ditolak. Presign tanpa kredensial menghasilkan HTTP 500 tanpa fallback lokal. Pemeriksaan HTTP untuk seluruh operasi storage internal seperti move dan existence check belum dilakukan. Unit test tidak dijalankan.
