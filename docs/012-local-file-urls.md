# #12: Amankan akses file melalui S3 saja

Sumber: [Issue #12](https://github.com/ifanferdi/POS-nextjs-express/issues/12). Status pada 17 November 2026: terbuka.

[PR #33](https://github.com/ifanferdi/POS-nextjs-express/pull/33): ditutup tanpa merge; base `api`.

Catatan 17 November 2026: issue #38 memperjelas kontrak S3 privat untuk seluruh file terkelola. Panduan local mode dan `/public/files` di catatan lama ini tidak berlaku setelah cutover; ikuti [dokumen #38](038-private-s3.md).

## Kebutuhan

Gunakan S3 API sebagai satu-satunya storage backend, dengan bucket privat. File yang dikelola aplikasi tidak disajikan dari filesystem proyek atau endpoint local.

## Kriteria penerimaan

- [ ] Bucket privat menolak akses baca anonim; operasi storage tidak memakai fallback ke filesystem atau kredensial bawaan publik.
- [ ] Upload presigned PUT dan multipart menulis ke S3 serta mengembalikan object key untuk disimpan client.
- [ ] API menerbitkan signed GET untuk object key sah; URL gambar produk pihak ketiga tetap didukung.

## Dampak pada client

Simpan object key dari respons upload, bukan presigned PUT URL atau signed GET URL. Gunakan signed GET dari API untuk file terkelola dan minta URL baru setelah expiry. Jangan mengandalkan mode local atau `/public/files`; URL gambar pihak ketiga pada produk tetap didukung. Lihat #38 untuk dampak cutover dan prefix object key.

## Verifikasi dan pekerjaan tersisa

PR #33 mencatat HTTP smoke dan build untuk alur local, tetapi bukti itu tidak memenuhi acceptance S3-only. HTTP smoke terhadap MinIO privat dilakukan untuk issue #38; rincian hasil dan pemeriksaan yang belum dilakukan ada di [#38](038-private-s3.md).

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
