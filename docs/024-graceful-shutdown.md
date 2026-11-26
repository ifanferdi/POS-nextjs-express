# #24: Selesaikan request aktif saat shutdown

Sumber: [Issue #24](https://github.com/ifanferdi/POS-nextjs-express/issues/24). Status pada 17 November 2026: terbuka.

[PR #28](https://github.com/ifanferdi/POS-nextjs-express/pull/28): draft; base `api`.

## Kebutuhan

Saat SIGTERM, hentikan penerimaan request baru, tunggu request aktif, lalu tutup SSE, Redis, dan pool Prisma sebelum keluar.

## Kriteria penerimaan

- [ ] SIGTERM menghentikan penerimaan request baru dan menunggu request aktif selesai sebelum proses keluar.
- [ ] Koneksi yang dimiliki proses ditutup setelah server selesai menguras request.
- [ ] Verifikasi dengan request order atau webhook yang aktif saat shutdown tanpa unit test.

## Dampak pada client

Tangani SSE yang terputus dengan reconnect dan backoff. Toleransi 503 sementara saat deploy. Retry operasi tulis harus mempertahankan key idempotensi bila endpoint mendukungnya, khususnya pembuatan order.

## Verifikasi dan pekerjaan tersisa

PR mencatat webhook parsial selesai saat SIGTERM lalu proses keluar; handshake SSE terlambat menerima 503. Typecheck lulus. Request yang macet masih dapat menahan shutdown sampai grace limit supervisor. PR #34 bergantung pada branch ini.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
