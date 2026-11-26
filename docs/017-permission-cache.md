# #17: Hapus cache izin seluruh pengguna terdampak

Sumber: [Issue #17](https://github.com/ifanferdi/POS-nextjs-express/issues/17). Status pada 17 November 2026: terbuka.

[PR #31](https://github.com/ifanferdi/POS-nextjs-express/pull/31): draft; base `api`.

## Kebutuhan

Bersihkan cache profil, role, dan permission seluruh pengguna terdampak, termasuk lebih dari sepuluh pengguna dan lintas role, sebelum relasi dihapus.

## Kriteria penerimaan

- [ ] Cache permission dan profil seluruh pengguna terdampak dibersihkan, termasuk saat jumlahnya melebihi sepuluh.
- [ ] Perubahan yang memengaruhi beberapa role juga menjangkau semua pengguna terkait.
- [ ] Verifikasi akses sebelum dan sesudah pencabutan lewat API dan Redis tanpa unit test.

## Dampak pada client

Setelah perubahan role/permission, invalidasi cache client dan muat ulang data terkait. Pada sesi pengguna terdampak, tangani penolakan akses dan perbarui tampilan izin. Tidak ada perubahan bentuk payload yang didokumentasikan.

## Verifikasi dan pekerjaan tersisa

PR mencatat API/Redis: penghapusan permission pada 13 pengguna/dua role, update pada 12 role/pengguna, dan penghapusan role pada 11 pengguna. Build lulus.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
