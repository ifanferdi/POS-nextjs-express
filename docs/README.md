# Tiket hardening POS API

Dokumen ini mencatat issue yang diperiksa pada 17 November 2026: spesifikasi induk #11 dan 14 tiket implementasi (#12 sampai #24 serta #38). Nomor issue menjadi urutan dokumentasi; nomor PR memiliki urutan terpisah. PR lama #1 sampai #10 berada di luar rangkaian hardening #11 dan tidak dihitung sebagai tiket implementasi ini.

## Daftar issue, kebutuhan, dan PR

| Issue                               | Kebutuhan                                                  | PR                                                             | Status issue / PR       |
| ----------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- | ----------------------- |
| [#11](011-hardening-spec.md)        | Spec: harden keamanan, order, pembayaran, dan sesi POS API | -                                                              | open / spec             |
| [#12](012-local-file-urls.md)       | Amankan akses file melalui S3 saja                         | [#33](https://github.com/ifanferdi/POS-nextjs-express/pull/33) | open / closed           |
| [#13](013-jwt-secret.md)            | Wajibkan secret JWT dari deployment                        | [#25](https://github.com/ifanferdi/POS-nextjs-express/pull/25) | closed / merged         |
| [#14](014-sse-access.md)            | Batasi event SSE menurut izin dan penerima                 | [#34](https://github.com/ifanferdi/POS-nextjs-express/pull/34) | open / draft            |
| [#15](015-sensitive-permissions.md) | Lindungi permission sensitif saat membuat role             | [#30](https://github.com/ifanferdi/POS-nextjs-express/pull/30) | closed / merged         |
| [#16](016-current-role.md)          | Hentikan otoritas token setelah role berubah               | [#32](https://github.com/ifanferdi/POS-nextjs-express/pull/32) | open / ready for review |
| [#17](017-permission-cache.md)      | Hapus cache izin seluruh pengguna terdampak                | [#31](https://github.com/ifanferdi/POS-nextjs-express/pull/31) | open / draft            |
| [#18](018-otp-login.md)             | Terapkan OTP saat 2FA aktif                                | [#35](https://github.com/ifanferdi/POS-nextjs-express/pull/35) | open / draft            |
| [#19](019-cash-underpayment.md)     | Tolak pembayaran tunai yang kurang                         | [#29](https://github.com/ifanferdi/POS-nextjs-express/pull/29) | open / draft            |
| [#20](020-order-cancellation.md)    | Satukan alur pembatalan order                              | [#36](https://github.com/ifanferdi/POS-nextjs-express/pull/36) | open / draft            |
| [#21](021-midtrans-recovery.md)     | Pulihkan order saat charge Midtrans gagal                  | [#37](https://github.com/ifanferdi/POS-nextjs-express/pull/37) | open / draft            |
| [#22](022-refresh-session-ttl.md)   | Benarkan masa berlaku refresh session                      | [#26](https://github.com/ifanferdi/POS-nextjs-express/pull/26) | open / draft            |
| [#23](023-redis-logs.md)            | Samarkan kredensial Redis di log                           | [#27](https://github.com/ifanferdi/POS-nextjs-express/pull/27) | open / draft            |
| [#24](024-graceful-shutdown.md)     | Selesaikan request aktif saat shutdown                     | [#28](https://github.com/ifanferdi/POS-nextjs-express/pull/28) | open / draft            |
| [#38](038-private-s3.md)            | Gunakan S3 privat untuk file terkelola                     | [#39](https://github.com/ifanferdi/POS-nextjs-express/pull/39) | open / open             |

Status closed/merged tidak berarti seluruh bukti acceptance criteria sudah lengkap. Contohnya, body PR #25 dan #30 masih mencatat pengujian HTTP yang pending meskipun issue terkait sudah ditutup. Dokumen per issue mempertahankan perbedaan tersebut.

## Urutan review dan dependensi

Daftar PR di bawah mengikuti nomor kecil ke besar. Ini urutan dokumentasi; dependensi tetap menentukan urutan merge.

| PR                                                             | Issue                               | Catatan review                                                                         |
| -------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| [#25](https://github.com/ifanferdi/POS-nextjs-express/pull/25) | [#13](013-jwt-secret.md)            | Sudah merged.                                                                          |
| [#26](https://github.com/ifanferdi/POS-nextjs-express/pull/26) | [#22](022-refresh-session-ttl.md)   | Draft; periksa bukti serta pekerjaan tersisa pada dokumen issue.                       |
| [#27](https://github.com/ifanferdi/POS-nextjs-express/pull/27) | [#23](023-redis-logs.md)            | Draft; periksa bukti serta pekerjaan tersisa pada dokumen issue.                       |
| [#28](https://github.com/ifanferdi/POS-nextjs-express/pull/28) | [#24](024-graceful-shutdown.md)     | Draft; periksa bukti serta pekerjaan tersisa pada dokumen issue.                       |
| [#29](https://github.com/ifanferdi/POS-nextjs-express/pull/29) | [#19](019-cash-underpayment.md)     | Draft; periksa bukti serta pekerjaan tersisa pada dokumen issue.                       |
| [#30](https://github.com/ifanferdi/POS-nextjs-express/pull/30) | [#15](015-sensitive-permissions.md) | Sudah merged; review otoritas terkini pada #32 tetap diperlukan.                       |
| [#31](https://github.com/ifanferdi/POS-nextjs-express/pull/31) | [#17](017-permission-cache.md)      | Draft; periksa bukti serta pekerjaan tersisa pada dokumen issue.                       |
| [#32](https://github.com/ifanferdi/POS-nextjs-express/pull/32) | [#16](016-current-role.md)          | Ready for review; terkait guard yang sudah merged di #30.                              |
| [#33](https://github.com/ifanferdi/POS-nextjs-express/pull/33) | [#12](012-local-file-urls.md)       | Ditutup tanpa merge; pendekatan local bertentangan dengan spesifikasi S3.               |
| [#34](https://github.com/ifanferdi/POS-nextjs-express/pull/34) | [#14](014-sse-access.md)            | Merge #28 dahulu, lalu ubah base ke api dan periksa ulang diff.                        |
| [#35](https://github.com/ifanferdi/POS-nextjs-express/pull/35) | [#18](018-otp-login.md)             | Draft; periksa bukti serta pekerjaan tersisa pada dokumen issue.                       |
| [#36](https://github.com/ifanferdi/POS-nextjs-express/pull/36) | [#20](020-order-cancellation.md)    | Draft; periksa bukti serta pekerjaan tersisa pada dokumen issue.                       |
| [#37](https://github.com/ifanferdi/POS-nextjs-express/pull/37) | [#21](021-midtrans-recovery.md)     | Merge #36 dahulu, lalu ubah base ke api dan periksa ulang diff; sandbox masih pending. |
| [#39](https://github.com/ifanferdi/POS-nextjs-express/pull/39) | [#38](038-private-s3.md)            | Private S3; review migrasi file local dan konfigurasi client.                          |

## Perubahan yang perlu diperiksa pada client

Tabel ini adalah daftar pekerjaan client yang perlu diperiksa atau diterapkan. Kode client tidak diaudit maupun diubah dalam sesi dokumentasi ini; kebutuhan berikut tidak menyatakan bahwa client saat ini pasti belum mendukungnya.

| Issue | Area client       | Penyesuaian                                                                                  |
| ----- | ----------------- | -------------------------------------------------------------------------------------------- |
| #12   | File dan upload   | Gunakan S3 privat; simpan object key dan tampilkan signed URL API. Rincian kontrak dan cutover local ada di #38. |
| #13   | Sesi login        | Tangani token yang ditolak setelah pergantian secret server.                                 |
| #14   | Realtime          | Perlakukan ringkasan SSE sebagai pemicu refetch detail order melalui API berizin.            |
| #15   | Role editor       | Filter permission sensitif dan tampilkan penolakan otorisasi server.                         |
| #16   | Profil dan menu   | Muat ulang otoritas terkini setelah perubahan role atau penolakan akses.                     |
| #17   | Cache permission  | Invalidasi data client setelah perubahan role/permission.                                    |
| #18   | Login             | Tambahkan challenge OTP; login belum selesai ketika requiresOtp bernilai true.               |
| #19   | Kasir tunai       | Validasi amount terhadap total diskon dan pembulatan; tangani error tanpa membuang input.    |
| #20   | Order             | Gunakan endpoint cancel; hentikan perubahan manual ke cancelled/expired dan klaim refund.    |
| #21   | Pembayaran online | Pertahankan UUID Idempotency-Key saat retry; tampilkan hasil belum pasti dan terima 200/201. |
| #22   | Refresh sesi      | Login ulang saat refresh kedaluwarsa.                                                        |
| #23   | Logging           | Tidak ada perubahan client.                                                                  |
| #24   | Deploy/reconnect  | Reconnect SSE dengan backoff dan tangani 503 sementara.                                      |
| #38   | File dan upload   | Persist `key`/`imagePath`; tampilkan `imageUrl` dan ambil ulang resource produk/pengguna setelah expiry. URL pihak ketiga produk tetap didukung. |

### Kontrak OTP pada PR #35

`POST /api/v1/auth/sign-in` saat 2FA aktif mengembalikan `message`, `requiresOtp: true`, `userId`, dan `challengeId`, tanpa access token. Client melanjutkan dengan:

```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{ "userId": 123, "challengeId": "<uuid-dari-sign-in>", "otp": "<kode-pengguna>" }
```

Nilai di atas adalah placeholder. Setelah verifikasi sukses, API mengembalikan token dan user; mode stateful juga mengembalikan refreshToken dan exp. Simpan sesi hanya sesudah respons sukses itu. Saat 2FA nonaktif, sign-in tetap mengembalikan token langsung.

Pada branch PR #35 yang diperiksa, route auth mendaftarkan sign-in, verify-otp, sign-out, dan refresh-token. Method controller resendOtp belum memiliki route terdaftar; jangan mengandalkan endpoint resend publik sebelum kontraknya ditambahkan dan diverifikasi.

## Batas verifikasi

Status dan kebutuhan berasal dari issue GitHub serta body PR yang diambil pada 17 November 2026. Kontrak OTP, route cancel, dan ringkasan SSE juga diperiksa langsung pada branch PR terkait karena indeks codebase-memory menandai mayoritas file kontrak sebagai berubah. Issue #38 diperiksa pada tanggal yang sama; HTTP smoke S3 privat belum dijalankan dalam pembaruan dokumentasi ini. Dokumen ini membedakan kebutuhan client dari implementasi client yang belum diperiksa.

Unit test, pengujian runtime baru, dan verifikasi sandbox tidak dijalankan untuk perubahan dokumentasi ini. Bukti pengujian sebelumnya serta keterbatasannya dicatat pada tiap issue.
