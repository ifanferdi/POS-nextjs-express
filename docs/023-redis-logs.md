# #23: Samarkan kredensial Redis di log

Sumber: [Issue #23](https://github.com/ifanferdi/POS-nextjs-express/issues/23). Status pada 17 November 2026: terbuka.

[PR #27](https://github.com/ifanferdi/POS-nextjs-express/pull/27): draft; base `api`.

## Kebutuhan

Sembunyikan username, password, dan URL Redis berkredensial, sambil mempertahankan kategori error yang aman untuk diagnosis.

## Kriteria penerimaan

- [ ] Log koneksi tidak mengandung username, password, atau URL Redis lengkap yang memuat kredensial.
- [ ] Status koneksi tetap cukup jelas untuk diagnosis; verifikasi output proses tanpa unit test.

## Dampak pada client

Tidak memerlukan perubahan kontrak maupun UI client. Penyesuaian terjadi pada logging server.

## Verifikasi dan pekerjaan tersisa

PR mencatat pemeriksaan proses refused connection dan wrong password tanpa dummy credential/URL/stack. Build penuh masih dicatat terhalang generated Prisma yang belum tersedia pada worktree saat pemeriksaan.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
