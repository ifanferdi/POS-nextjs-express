# #15: Lindungi permission sensitif saat membuat role

Sumber: [Issue #15](https://github.com/ifanferdi/POS-nextjs-express/issues/15). Status pada 17 November 2026: ditutup.

[PR #30](https://github.com/ifanferdi/POS-nextjs-express/pull/30): merged; base `api`.

## Kebutuhan

Terapkan pembatasan permission khusus Developer pada pembuatan role maupun assignment, termasuk input ID dan nama.

## Kriteria penerimaan

- [x] Admin tidak dapat membuat role berisi permission sensitif melalui ID maupun nama permission.
- [x] Pembatasan berlaku pada semua jalur pemberian permission, sementara Developer tetap dapat melakukan tugas yang sah.
- [x] Verifikasi memakai akun Admin dan Developer melalui API tanpa unit test.

## Dampak pada client

Filter opsi permission sensitif sesuai otoritas pengguna dan tampilkan error otorisasi dari server. UI tetap harus menangani penolakan walaupun pilihan sudah difilter. Tidak ada perubahan skema payload yang didokumentasikan.

## Verifikasi dan pekerjaan tersisa

PR sudah merged dan issue ditutup. Body PR mencatat review guard dan formatter; pengujian HTTP Admin/Developer masih dicatat pending. Review bersama #16 karena token role lama ditangani oleh tiket tersebut.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
