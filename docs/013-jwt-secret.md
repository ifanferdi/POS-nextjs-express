# #13: Wajibkan secret JWT dari deployment

Sumber: [Issue #13](https://github.com/ifanferdi/POS-nextjs-express/issues/13). Status pada 17 November 2026: ditutup.

[PR #25](https://github.com/ifanferdi/POS-nextjs-express/pull/25): merged; base `api`.

## Kebutuhan

Wajibkan operator memasok HASH_SECRET di environment deployment dan hentikan startup jika kosong.

## Kriteria penerimaan

- [x] Konfigurasi deployment tidak memuat kunci JWT tetap.
- [x] API gagal mulai dengan pesan jelas ketika kunci belum disediakan.
- [x] Token yang dibuat dengan kunci deployment valid; verifikasi melalui API tanpa unit test.

## Dampak pada client

Tidak ada perubahan bentuk request/response. Jika operator mengganti secret, token lama dapat ditolak; client harus menangani autentikasi ulang. Secret hanya disimpan di server.

## Verifikasi dan pekerjaan tersisa

PR sudah merged dan issue ditutup. PR mencatat validasi Compose dan smoke sign/verify JWT, tetapi body PR masih menyatakan verifikasi penerimaan token melalui HTTP belum dilakukan. Status closed tidak menggantikan bukti pengujian itu.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
