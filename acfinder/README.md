# AC Finder — Aslan Teknik

Rute statis: `/acfinder/` (`index.html`, `app.mjs`, `engine.mjs`, `inventory.mjs`). Tidak mengubah atau mengimpor fitur booking. Tautan booking langsung menuju `/booking`.

## Data dan status produk

`affiliate-links.json` adalah daftar tautan afiliasi ASLI dari pemilik. `products.json` adalah katalog terstruktur yang dibaca halaman publik. Field:

- `product_id`, `affiliate_url`, `brand`, `model`, `product_name`, `pk`, `inverter`, `price`, `budget_category`
- `specifications`, `image`, `rating`, `review_count`, `verification_status`, `last_checked`, `active`
- `source_url`, `verification_notes` untuk jejak pemeriksaan.

**Jangan mengisi metadata berdasarkan urutan tautan atau label merek yang diberikan bersama daftar.** Tautan pendek hanya membuktikan redirect ke Shopee; halaman publik dapat menutup metadata bagi bot. Item yang belum punya data diberi `unverified`; spesifikasi yang diberikan pemilik tetapi masih kurang (misalnya jenis inverter) diberi `partial` dan ditampilkan terpisah sebagai **opsi cek manual**, bukan rekomendasi penuh. Hanya item `verified` dengan PK, jenis, harga, model, serta catatan asal yang lengkap masuk ranking. Harga dari pemilik adalah harga acuan, bukan harga Shopee yang dicek langsung. Varian berbeda dapat memakai URL afiliasi yang sama, tetapi pembeli harus memilih varian yang disebut sebelum checkout.

## Menambah produk

1. Tambahkan objek `{ "brand_hint": "...", "affiliate_url": "https://s.shopee.co.id/..." }` ke `affiliate-links.json`. `brand_hint` hanya informasi dari pemilik, bukan bukti spesifikasi dan tidak otomatis dijadikan merek produk.
2. Jalankan `node acfinder/sync-products.mjs --check-links` dari root repo. Script mengikuti redirect, menerima hanya domain Shopee, dan mencoba metadata HTML publik. Ia tidak mengubah URL afiliasi asli.
3. Bila Shopee tidak menyediakan metadata harga/PK/inverter melalui HTML publik, verifikasi melalui halaman produk asli atau sumber resmi. Isi field terkait di `products.json`, termasuk `model`, `product_name`, `brand`, `pk` numerik (mis. 0.5/0.75/1/1.5/2), `inverter` boolean, `price` angka rupiah, `budget_category` yang sesuai, dan catat sumber di `verification_notes`. Baru set `verification_status: "verified"`. Jangan menyamakan foto/rating yang tidak tersedia dengan data pasti.
4. Jalankan `node --test acfinder/engine.test.mjs` dan periksa halaman lewat browser sebelum menerbitkan. Script sync berikutnya mempertahankan metadata manual untuk URL yang sama; penghapusan tautan dari `affiliate-links.json` akan menghapusnya dari katalog pada sinkronisasi berikutnya.

Ini katalog berbasis file untuk situs statis: penambahan link perlu sinkronisasi dan publikasi ulang. Tanpa backend atau API produk terotorisasi dari Shopee, verifikasi otomatis penuh untuk semua atribut **tidak dapat dijamin**. Jangan tampilkan produk tidak terverifikasi sekadar agar halaman berisi tautan afiliasi.

## Mesin rekomendasi

Perkiraan kebutuhan berdasar luas × 500 BTU/m² lalu koreksi plafon, penghuni, matahari, dan perangkat; dibulatkan ke kapasitas pasar ½, ¾, 1, 1½, 2, 2½, 3 PK. Ini bukan survei HVAC dan ditampilkan sebagai perkiraan. Pilihan inverter eksplisit diikuti; mode otomatis mempertimbangkan durasi/prioritas. Produk harus lolos status, tipe, kapasitas cukup, dan budget. Maksimal tiga peran tanpa duplikasi; label efisien hanya jika ada spesifikasi efisiensi terverifikasi. Jika tidak ada kecocokan, jangan turunkan kapasitas atau melampaui budget diam-diam.

## Pengujian

`node --test acfinder/engine.test.mjs`

Tidak ada transaksi. Tombol produk (bila produk terverifikasi) selalu membuka `affiliate_url` yang persis tersimpan.
