# #18: Terapkan OTP saat 2FA aktif

Sumber: [Issue #18](https://github.com/ifanferdi/POS-nextjs-express/issues/18). Status pada 17 November 2026: terbuka.

[PR #35](https://github.com/ifanferdi/POS-nextjs-express/pull/35): draft; base `api`.

## Kebutuhan

Saat AUTH_USE_2FA aktif, terbitkan challenge setelah password benar dan terbitkan token hanya sesudah OTP berhasil dikonsumsi sekali.

## Kriteria penerimaan

- [ ] Password benar saat 2FA aktif menghasilkan tantangan OTP, bukan access token langsung.
- [ ] OTP salah atau kedaluwarsa tidak menerbitkan token; OTP benar menerbitkannya.
- [ ] Saat 2FA nonaktif, alur login biasa tetap berfungsi; verifikasi lewat API tanpa unit test.

## Dampak pada client

Tambahkan state verifikasi OTP. Sign-in mengembalikan requiresOtp, userId, challengeId tanpa token; POST /api/v1/auth/verify-otp menerima userId, challengeId, otp. Simpan kredensial hanya setelah verifikasi berhasil. Tangani OTP salah, expired, replay, dan rate limit. Saat 2FA nonaktif, pertahankan login satu langkah.

## Verifikasi dan pekerjaan tersisa

PR mencatat integrasi HTTP stateful/stateless, OTP salah/expired/replay/rate-limit, konsumsi paralel yang hanya menghasilkan satu token, dan login tanpa 2FA. Pengiriman email nyata belum diverifikasi. Route resend OTP publik belum terdaftar pada branch ini; jangan membuat UI yang mengasumsikannya tersedia.

Bukti di atas merangkum issue dan body PR pada tanggal pencatatan, bukan hasil pengujian ulang pada sesi dokumentasi ini. Status GitHub dapat berubah; periksa tautan sumber sebelum release.
