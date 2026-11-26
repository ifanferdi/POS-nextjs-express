# #22: Benarkan masa berlaku refresh session

Sumber: [Issue #22](https://github.com/ifanferdi/POS-nextjs-express/issues/22). Status pada 17 November 2026: terbuka.

[PR #26](https://github.com/ifanferdi/POS-nextjs-express/pull/26): draft; base `api`.

## Kebutuhan

Gunakan default sesi refresh 30 hari dalam unit yang benar, sambil menghormati override konfigurasi.

## Kriteria penerimaan

- [ ] Default tanpa override menghasilkan masa berlaku 30 hari, bukan nilai milidetik yang ditafsirkan sebagai detik.
- [ ] Nilai konfigurasi eksplisit tetap dihormati.
- [ ] Verifikasi TTL aktual pada Redis dan alur refresh melalui API tanpa unit test.

## Dampak pada client

Tangani refresh yang kedaluwarsa dengan login ulang. Jangan mengasumsikan refresh token berlaku tanpa batas atau menetapkan masa berlaku berdasarkan default lama. Tidak ada perubahan skema respons yang didokumentasikan.

## Verifikasi dan pekerjaan tersisa

PR mencatat TTL Redis 2592000 detik untuk default dan 604800 detik untuk override eksplisit 604800000. HTTP sign-in/refresh masih dicatat pending. Sesi lama mempertahankan TTL sebelumnya.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
