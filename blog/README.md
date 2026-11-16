# Blog aslanteknik.id

Artikel baru:

1. Salin folder `blog/_template/` menjadi `blog/<slug>/` (slug huruf kecil, pakai tanda hubung, contoh `cara-merawat-ac-inverter`).
2. Di `blog/<slug>/index.html` ganti: `<title>`, meta `description`, `canonical`, `og:title`, `og:description`, `og:url`,
   `article:published_time` (format `YYYY-MM-DD`), `<h1>`, tanggal di `.article-meta`, dan isi `.article-body`.
3. Hapus baris `<meta name="robots" content="noindex">`.
4. Jalankan `python3 tools/build.py` dari root repo. Perintah ini menambahkan artikel ke daftar `/blog/` dan ke `sitemap.xml`.
5. Commit dan push.

Fakta resmi untuk dipakai di artikel: cuci AC mulai Rp110.000, pengecekan mulai Rp80.000, garansi 14 hari,
jam buka 09.00–16.00 Senin–Minggu (Jumat libur), konfirmasi WhatsApp dalam 15 menit,
area layanan Jakarta Selatan, Depok, dan Tangerang Selatan.
