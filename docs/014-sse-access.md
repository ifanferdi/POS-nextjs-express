# #14: Batasi event SSE menurut izin dan penerima

Sumber: [Issue #14](https://github.com/ifanferdi/POS-nextjs-express/issues/14). Status pada 17 November 2026: terbuka.

[PR #34](https://github.com/ifanferdi/POS-nextjs-express/pull/34): draft; base `fix/issue-24-graceful-shutdown`.

## Kebutuhan

Batasi langganan dan penerimaan event order menurut izin serta pemilik order, dan hentikan broadcast detail pembayaran/profil ke semua akun.

## Kriteria penerimaan

- [ ] Pengguna tanpa izin order tidak dapat berlangganan detail order melalui SSE.
- [ ] Event tidak menyiarkan seluruh data order, pembayaran, atau profil ke semua pengguna yang terhubung.
- [ ] Pengguna yang berhak tetap menerima pembaruan yang diperlukan; verifikasi dengan dua akun melalui API tanpa unit test.

## Dampak pada client

Sesuaikan type dan handler SSE dengan ringkasan order berisi id, orderNumber, status. Event memicu invalidasi cache/refetch detail melalui endpoint berizin. Tangani penolakan langganan dan berhentinya koneksi. Jangan mengandalkan event sebagai seluruh objek order.

## Verifikasi dan pekerjaan tersisa

PR mencatat smoke dua akun: Admin menerima ringkasan order dan akun Product-only tidak menerima detail order/payment/profile. Build gabungan lulus. Publisher webhook Midtrans belum diuji langsung melalui HTTP. Bergantung pada PR #28.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
