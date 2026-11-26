# POS API File Glossary

Istilah ini menjelaskan perbedaan file produk/profil yang dikelola API, referensinya, dan URL sementara yang dipakai untuk mengaksesnya.

## File dan akses

**Public file** (`file publik`): File yang boleh ditampilkan kepada pengguna. Status publik menjelaskan tujuan tampilnya file, bukan izin untuk membaca object secara anonim.
_Avoid_: object publik

**Managed file** (`file terkelola`): File produk atau profil yang disimpan dan dikelola aplikasi, bukan URL file milik situs pihak ketiga.
_Avoid_: file public, URL lokal

**Object key**: Identifier stabil sebuah object di penyimpanan. Key menjadi referensi file terkelola dan tidak berubah menjadi URL ketika file dibaca.
_Avoid_: URL file, signed URL

**Presigned URL**: URL bertanda tangan dengan masa berlaku terbatas yang memberi izin untuk satu operasi pada object tertentu, seperti upload atau download. URL ini bukan identifier permanen file.
_Avoid_: URL permanen, object key
