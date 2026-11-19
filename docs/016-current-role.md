# #16: Hentikan otoritas token setelah role berubah

Sumber: [Issue #16](https://github.com/ifanferdi/POS-nextjs-express/issues/16). Status pada 17 November 2026: terbuka.

[PR #32](https://github.com/ifanferdi/POS-nextjs-express/pull/32): ready for review; base `api`.

## Kebutuhan

Gunakan role pengguna terkini dari database ketika memeriksa token, sehingga demosi segera mencabut otoritas lama.

## Kriteria penerimaan

- [ ] Token Developer yang diterbitkan sebelum penurunan role tidak dapat memberi permission khusus Developer setelah perubahan.
- [ ] Perubahan role tidak meninggalkan otoritas lama pada sesi atau cache.
- [ ] Verifikasi dengan token lama dan role baru melalui API tanpa unit test.

## Dampak pada client

Jangan menjadikan role di JWT sebagai sumber otoritas permanen. Saat akses ditolak setelah perubahan role, muat ulang profil/permission dan perbarui menu serta tombol; tangani 401/403 sesuai respons API.

## Verifikasi dan pekerjaan tersisa

PR ready for review. Skenario integrasi HTTP mencatat token Developer lama mendapat 403 setelah demosi dan cache dievikt. Build lulus.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
