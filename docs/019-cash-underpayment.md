# #19: Tolak pembayaran tunai yang kurang

Sumber: [Issue #19](https://github.com/ifanferdi/POS-nextjs-express/issues/19). Status pada 17 November 2026: terbuka.

[PR #29](https://github.com/ifanferdi/POS-nextjs-express/pull/29): draft; base `api`.

## Kebutuhan

Tolak uang tunai di bawah total setelah diskon dan pembulatan sebelum membuat order lunas atau mengurangi stok.

## Kriteria penerimaan

- [ ] Jumlah tunai dibandingkan dengan tagihan setelah diskon dan pembulatan.
- [ ] Pembayaran yang kurang ditolak tanpa membuat order lunas, mengurangi stok, atau menghasilkan kembalian negatif.
- [ ] Pembayaran yang cukup tetap berhasil; verifikasi melalui API dan database tanpa unit test.

## Dampak pada client

Hitung pratinjau tagihan dengan diskon dan pembulatan, validasi amount, dan tampilkan error server jika kurang. Pertahankan input transaksi setelah penolakan agar kasir dapat memperbaikinya. Server tetap menjadi sumber total final.

## Verifikasi dan pekerjaan tersisa

PR mencatat HTTP 400 untuk amount 299 pada tagihan 300 tanpa perubahan order/payment/stok/usedQty; amount 300 menghasilkan 201. Kegagalan pemulihan kuota Redis menghasilkan 500 dan counter dapat sementara terlalu rendah; kompensasi durable tetap keterbatasan yang dicatat PR.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
