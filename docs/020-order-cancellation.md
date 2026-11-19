# #20: Satukan alur pembatalan order

Sumber: [Issue #20](https://github.com/ifanferdi/POS-nextjs-express/issues/20). Status pada 17 November 2026: terbuka.

[PR #36](https://github.com/ifanferdi/POS-nextjs-express/pull/36): draft; base `api`.

## Kebutuhan

Klaim pembatalan secara atomik, kembalikan stok sekali, dan tolak pembatalan order online yang sudah dibayar tanpa mencatat refund.

## Kriteria penerimaan

- [ ] Dua pembatalan serentak mengembalikan stok tepat satu kali.
- [ ] Endpoint perubahan status tidak dapat melewati efek pembatalan.
- [ ] Pembatalan order online yang sudah dibayar ditolak tanpa mengubah order, pembayaran, atau stok; tidak ada proses refund.
- [ ] Verifikasi pembatalan biasa, serentak, dan berbayar melalui API dan database tanpa unit test.

## Dampak pada client

Gunakan POST /api/v1/orders/:id/cancel. Hapus aksi yang mengirim cancelled atau expired melalui PUT /api/v1/orders/:id/status. Jangan membuka ulang order terminal. Sembunyikan aksi cancel untuk order online lunas dan tetap tangani penolakan dari API. Setelah sukses, refetch order/payment/stok; jangan menampilkan refund berhasil.

## Verifikasi dan pekerjaan tersisa

PR mencatat enam skenario API/database termasuk cancel serentak, paid-online rejection, expired guard, dan rollback klaim pembayaran yang kalah. Build lulus. PR #37 ditumpuk di atas branch ini.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
