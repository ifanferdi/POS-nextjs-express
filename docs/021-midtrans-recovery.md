# #21: Pulihkan order saat charge Midtrans gagal

Sumber: [Issue #21](https://github.com/ifanferdi/POS-nextjs-express/issues/21). Status pada 17 November 2026: terbuka.

[PR #37](https://github.com/ifanferdi/POS-nextjs-express/pull/37): draft; base `fix/issue-20-cancel-order`.

## Kebutuhan

Pulihkan charge gagal secara konsisten dan rekonsiliasi hasil yang belum pasti sebelum melepas reservasi atau membuat transaksi baru. Simpan UUID idempotensi per kasir di PostgreSQL.

## Kriteria penerimaan

- [ ] Kegagalan charge yang pasti memulihkan atau menutup order, stok, kuota, dan kunci idempotency secara konsisten.
- [ ] Jika hasil charge belum pasti karena timeout, status gateway diperiksa sebelum melepas stok atau membuat order baru.
- [ ] Retry dengan kunci yang sama tidak menggandakan order; verifikasi lewat API, database, dan Midtrans sandbox tanpa unit test.

## Dampak pada client

Buat satu UUID Idempotency-Key per transaksi logis dan pertahankan key itu saat retry akibat timeout/500 atau hasil belum pasti. Jangan otomatis membuat key baru atau menyatakan pembayaran gagal final hanya karena error jaringan. Tampilkan status menunggu konfirmasi, dukung respons 200 pada retry dan 201 pada create, serta gunakan order dan detail pembayaran/QRIS dari API. Kunci baru hanya untuk transaksi baru yang disengaja.

## Verifikasi dan pekerjaan tersisa

PR mencatat tujuh integrasi HTTP dengan PostgreSQL/Redis lokal dan gateway tiruan, build/typecheck, dan migrasi pada database baru. Midtrans sandbox nyata masih pending. Wajib migrate deploy, generate Prisma, lalu build; order lama tanpa key tidak mendapat perlindungan durable ini. Bergantung pada PR #36.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
