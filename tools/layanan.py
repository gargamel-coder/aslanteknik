"""Halaman SEO layanan × kota: /<kota>/<layanan>/  (5 layanan × 3 kota = 15 halaman).

Dipanggil oleh tools/build.py. Harga dibaca langsung dari /pricelist/index.html,
jadi cukup ubah daftar harga lalu jalankan build lagi.

Kerangka halaman (nav, footer, script tracking) diambil dari blog/_template/index.html
supaya tampilan sama dengan halaman lain.
"""
import html
import json
import re

E = html.escape
WA = '62895326105290'
SITE = 'https://aslanteknik.id'

# ---------------------------------------------------------------- bisnis (schema)
BUSINESS_ID = f'{SITE}/#bisnis'


def business_schema():
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday']
    return {
        '@context': 'https://schema.org',
        '@type': 'HVACBusiness',
        '@id': BUSINESS_ID,
        'name': 'Aslan Teknik',
        'url': f'{SITE}/',
        'telephone': '+' + WA,
        'image': f'{SITE}/web-app-manifest-512x512.png',
        'logo': f'{SITE}/web-app-manifest-512x512.png',
        'priceRange': 'Rp80.000–Rp815.000',
        'currenciesAccepted': 'IDR',
        'hasMap': 'https://maps.app.goo.gl/NJDap5rnooYU5uKLA',
        'openingHoursSpecification': [{
            '@type': 'OpeningHoursSpecification', 'dayOfWeek': days,
            'opens': '09:00', 'closes': '16:00'}],
        'areaServed': [{'@type': 'City', 'name': n} for n in
                       ('Jakarta Selatan', 'Depok', 'Tangerang Selatan')],
    }


def ld(obj):
    return ('<script type="application/ld+json">\n'
            + json.dumps(obj, ensure_ascii=False, indent=2) + '\n</script>')


# ---------------------------------------------------------------- harga
def read_prices(pricelist_html):
    """{nama pekerjaan: (deskripsi, [harga split½-1, split1½-2, inv½-1, inv1½-2])}"""
    out = {}
    for row in re.findall(r'<tr>(.*?)</tr>', pricelist_html, re.S):
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.S)
        if len(cells) != 5:
            continue
        b = re.search(r'<b>(.*?)</b>', cells[0], re.S)
        sp = re.search(r'<span>(.*?)</span>', cells[0], re.S)
        if not b:
            continue
        name = html.unescape(b.group(1)).strip()
        desc = html.unescape(sp.group(1)).strip() if sp else ''
        prices = [rp(rp_int(html.unescape(re.sub(r'<[^>]+>', '', c)))) for c in cells[1:]]
        out[name] = (desc, prices)
    return out


def rp_int(s):
    return int(re.sub(r'\D', '', s))


def rp(n):
    return 'Rp' + f'{n:,}'.replace(',', '.')


# ---------------------------------------------------------------- kota
CITIES = {
    'jakarta-selatan': dict(
        name='Jakarta Selatan', short='Jaksel',
        areas=['Kemang', 'Tebet', 'Kebayoran Baru', 'Fatmawati', 'Cipete', 'Pondok Indah', 'Cilandak',
               'Mampang', 'Jagakarsa', 'Blok M', 'Senopati'],
        tempat='rumah, apartemen, dan kantor'),
    'depok': dict(
        name='Depok', short='Depok',
        areas=['Beji', 'Pancoran Mas', 'Sawangan', 'Cinere', 'Cimanggis', 'Sukmajaya', 'Tapos',
               'Cilodong', 'Bojongsari'],
        tempat='rumah, kost, ruko, dan kantor'),
    'tangerang-selatan': dict(
        name='Tangerang Selatan', short='Tangsel',
        areas=['BSD City', 'Alam Sutera', 'Serpong', 'Pamulang', 'Ciputat', 'Pondok Aren', 'Bintaro'],
        tempat='rumah, apartemen, dan kantor'),
}

# ---------------------------------------------------------------- layanan
# rows   : nama baris di /pricelist/ yang ditampilkan di tabel
# booking: data-k chip di /booking (None = tanpa preselect)
SERVICES = {
    'cuci-ac': dict(
        label='Cuci AC', kw='cuci AC', rows=['Cuci AC'], booking='cuci',
        title='Cuci AC {city} Mulai {min}, Garansi 14 Hari | Aslan Teknik',
        h1='Cuci AC {city}',
        desc='Cuci AC {city} mulai {min}/unit, garansi 14 hari. Teknisi datang ke {tempat}. '
             'Jadwal dikonfirmasi lewat WhatsApp dalam 15 menit.',
        what='<p>Cuci AC kami adalah cuci menyeluruh, bukan sekadar lap filter. Teknisi membongkar bagian yang perlu, '
             'mencuci evaporator di unit indoor dan kondensor di unit outdoor, lalu membersihkan saluran '
             'pembuangan supaya air tidak menetes lagi. Pengerjaan biasanya 1–3 jam, tergantung jumlah unit '
             'dan kondisinya.</p>',
        signs=['Dinginnya berkurang padahal suhu sudah paling rendah.',
               'Muncul bau apek atau bau jamur saat AC dinyalakan.',
               'Air menetes dari unit indoor.',
               'Tagihan listrik naik tanpa perubahan pemakaian.',
               'Terlihat bintik hitam di lubang angin atau di evaporator.'],
        extra=('Seberapa sering AC perlu dicuci?',
               '<p>Untuk pemakaian harian di rumah, 3–6 bulan sekali sudah cukup. Ruangan yang lembap atau AC '
               'yang menyala hampir seharian lebih cepat kotor, jadi cuci tiap 3 bulan lebih aman. Kantor dan '
               'tempat usaha dengan pemakaian berat sebaiknya dirawat lebih rutin.</p>'),
        faq=[('Berapa harga cuci AC di {city}?',
              'Mulai {min} per unit untuk AC split ½–1 PK. AC 1½–2 PK dan AC inverter mengikuti tabel harga di '
              'atas. Harga sama untuk semua area layanan kami.'),
             ('Berapa lama cuci AC?', 'Biasanya 1–3 jam, tergantung jumlah unit dan kondisinya.'),
             ('Apakah ada garansi?', 'Ada. Hasil cuci AC bergaransi 14 hari setelah pengerjaan.')],
        blog=[('/blog/harga-cuci-ac/', 'Berapa harga cuci AC? Panduan lengkap')],
    ),
    'service-ac': dict(
        label='Service AC', kw='service AC', booking='periksa',
        rows=['Pengecekan / Diagnosa', 'Ganti Kapasitor', 'Ganti Termis', 'Ganti Sensor', 'Overhaul'],
        title='Service AC {city}, Perbaikan AC Tidak Dingin | Aslan Teknik',
        h1='Service dan perbaikan AC {city}',
        desc='Service AC {city}: AC tidak dingin, mati sendiri, atau berisik. Pengecekan mulai {min}, harga '
             'perbaikan jelas sebelum dikerjakan. Garansi 14 hari.',
        what='<p>Kalau AC bermasalah, langkah pertama adalah pengecekan. Teknisi memeriksa unit indoor dan '
             'outdoor untuk menemukan penyebabnya, lalu menyampaikan perbaikan yang dibutuhkan beserta '
             'harganya sebelum mulai bekerja. Anda yang memutuskan lanjut atau tidak. Perbaikan yang umum '
             'adalah ganti kapasitor, ganti termis (overload protector), ganti sensor suhu, sampai overhaul '
             'untuk unit yang perlu dibongkar total.</p>',
        signs=['AC menyala tapi tidak dingin sama sekali.',
               'Unit outdoor tidak berputar atau sering mati sendiri.',
               'Lampu indikator berkedip atau muncul kode error.',
               'Suara berisik atau dengung dari unit indoor maupun outdoor.',
               'Suhu tidak sesuai dengan pengaturan remote.'],
        extra=('Cuci dulu atau langsung perbaikan?',
               '<p>AC yang kurang dingin belum tentu rusak. Sering kali penyebabnya hanya kotor, dan cukup '
               'diselesaikan dengan <a href="{cuci}">cuci AC</a>. Kalau penyebabnya belum jelas, pilih '
               'pengecekan. Teknisi akan memberi tahu apakah cukup dicuci, perlu tambah freon, atau ada komponen '
               'yang harus diganti.</p>'),
        faq=[('Berapa biaya service AC di {city}?',
              'Pengecekan mulai {min}. Biaya perbaikan tergantung kerusakannya, misalnya ganti kapasitor atau '
              'termis, dan disampaikan lebih dulu sebelum dikerjakan.'),
             ('AC saya tidak dingin, apa penyebabnya?',
              'Penyebab paling umum adalah AC kotor, freon kurang, atau kapasitor lemah. Pengecekan teknisi '
              'memastikan penyebabnya supaya Anda tidak membayar perbaikan yang tidak perlu.'),
             ('Apakah perbaikan bergaransi?', 'Ya, hasil pengerjaan bergaransi 14 hari.')],
        blog=[('/blog/ac-tidak-dingin-jakarta-selatan/', 'AC tidak dingin? Penyebab dan solusinya')],
    ),
    'isi-freon-ac': dict(
        label='Isi Freon AC', kw='isi freon AC', booking=None,
        rows=['Tambah Freon R22', 'Tambah Freon R32', 'Tambah Freon R410',
              'Isi Freon R22', 'Isi Freon R32', 'Isi Freon R410'],
        title='Isi Freon AC {city} R22, R32, R410 | Aslan Teknik',
        h1='Isi dan tambah freon AC {city}',
        desc='Isi dan tambah freon AC {city} untuk R22, R32, dan R410. Tambah freon mulai {min}, '
             'harga per jenis freon tertulis jelas. Garansi 14 hari.',
        what='<p>Ada dua jenis pekerjaan. <strong>Tambah freon</strong> untuk menutup kekurangan isi, misalnya '
             'saat tekanan freon turun. <strong>Isi freon</strong> adalah pengisian penuh untuk sistem yang '
             'sudah kosong, misalnya setelah perbaikan kebocoran atau pindah unit. Jenis freon harus sesuai '
             'unit: R22 untuk AC lama, R32 untuk kebanyakan AC inverter, dan R410 untuk sebagian unit lain. '
             'Teknisi mengecek jenis dan tekanannya sebelum mengisi.</p>',
        signs=['AC dingin sebentar lalu terasa hanya meniupkan angin.',
               'Ada bunga es di pipa atau di unit indoor.',
               'Unit outdoor menyala terus tapi ruangan tidak kunjung dingin.',
               'AC baru dibongkar pasang atau dipindahkan.'],
        extra=('Apakah freon harus diisi rutin?',
               '<p>Tidak. Freon bekerja dalam sistem tertutup, jadi dalam kondisi normal tidak habis. Kalau freon '
               'sering kurang, kemungkinan ada kebocoran yang perlu dicek dulu. Karena itu kami sarankan '
               '<a href="{service}">pengecekan</a> bila AC sering kehilangan dingin, supaya Anda tidak '
               'berulang kali membayar tambah freon.</p>'),
        faq=[('Berapa harga isi freon AC di {city}?',
              'Tambah freon mulai {min} untuk AC ½–1 PK. Isi penuh dan unit 1½–2 PK mengikuti tabel di atas, '
              'tergantung jenis freon R22, R32, atau R410.'),
             ('Bagaimana tahu AC saya pakai freon apa?',
              'Jenis freon biasanya tertulis di stiker unit outdoor. Kalau tidak yakin, teknisi akan '
              'mengeceknya di lokasi sebelum mengisi.'),
             ('Apa bedanya tambah freon dan isi freon?',
              'Tambah freon menutup kekurangan isi. Isi freon adalah pengisian penuh untuk sistem yang sudah '
              'kosong.')],
        blog=[('/blog/ac-tidak-dingin-jakarta-selatan/', 'AC tidak dingin? Penyebab dan solusinya')],
    ),
    'pasang-ac': dict(
        label='Pasang AC Baru', kw='pasang AC', rows=['Pasang / Instalasi Baru'], booking='pasang',
        title='Pasang AC Baru {city} Mulai {min} | Aslan Teknik',
        h1='Jasa pasang AC baru {city}',
        desc='Pasang AC baru {city} mulai {min}: unit indoor dan outdoor, jalur pipa, bobok tembok, '
             'dan vacuum. Garansi 14 hari.',
        what='<p>Instalasi mencakup pemasangan unit indoor dan outdoor, pembuatan jalur pipa, bobok tembok, '
             'dan vacuum sistem sebelum AC dinyalakan. Vacuum penting untuk membuang udara dan uap air dari '
             'jalur pipa, supaya AC dingin maksimal dan komponennya lebih awet.</p>',
        signs=['Baru membeli AC dan butuh dipasang.',
               'Menambah AC di kamar atau ruangan baru.',
               'Mengganti AC lama dengan unit baru.'],
        extra=('Belum menentukan AC mana yang dibeli?',
               '<p>Coba <a href="/acfinder/">AC Finder</a> untuk mencari AC yang cocok dengan ukuran ruangan dan '
               'kebutuhan Anda. Kapasitas (PK) yang pas membuat ruangan cepat dingin tanpa boros listrik.</p>'),
        faq=[('Berapa biaya pasang AC baru di {city}?',
              'Mulai {min} untuk AC ½–1 PK. Biaya untuk AC 1½–2 PK ada di tabel harga di atas.'),
             ('Apa saja yang termasuk dalam pemasangan?',
              'Pemasangan unit indoor dan outdoor, jalur pipa, bobok tembok, dan vacuum.'),
             ('Apakah pemasangan bergaransi?', 'Ya, hasil pemasangan bergaransi 14 hari.')],
        blog=[],
    ),
    'bongkar-pasang-ac': dict(
        label='Bongkar Pasang AC', kw='bongkar pasang AC', rows=['Bongkar', 'Bongkar + Pasang'],
        booking='bongpas',
        title='Bongkar Pasang AC {city} Mulai {min} | Aslan Teknik',
        h1='Bongkar pasang dan pindah AC {city}',
        desc='Jasa bongkar pasang AC {city} untuk pindah rumah, renovasi, atau pindah ruangan. Bongkar mulai '
             '{min}, freon dikosongkan ke tabung. Garansi 14 hari.',
        what='<p><strong>Bongkar</strong> berarti melepas unit indoor dan outdoor, termasuk mengosongkan freon '
             'ke tabung supaya tidak terbuang. <strong>Bongkar + pasang</strong> adalah paket pindah lengkap: '
             'dibongkar dari lokasi lama, dipasang di lokasi baru, dengan jalur pipa dan vacuum.</p>',
        signs=['Pindah rumah, kost, atau kantor dan AC ingin dibawa.',
               'Renovasi atau pengecatan ruangan.',
               'Memindahkan AC ke ruangan lain.',
               'Menurunkan AC lama sebelum diganti unit baru.'],
        extra=('Perlu tambah freon setelah dipindah?',
               '<p>Karena freon dikosongkan ke tabung saat pembongkaran, unit yang dipindah umumnya bisa dipakai '
               'kembali tanpa isi ulang. Teknisi tetap mengecek tekanan setelah pemasangan. Kalau ternyata '
               'kurang, <a href="{freon}">tambah freon</a> dikerjakan setelah Anda setuju dengan biayanya.</p>'),
        faq=[('Berapa biaya bongkar pasang AC di {city}?',
              'Bongkar saja mulai {min}. Biaya paket bongkar + pasang per ukuran AC ada di tabel harga di atas.'),
             ('Apakah bisa bongkar di satu tempat dan pasang di tempat lain?',
              'Bisa, itulah paket bongkar + pasang. Sebutkan kedua alamat saat booking supaya jadwalnya pas.'),
             ('Apakah ada garansi?', 'Ya, hasil pemasangan bergaransi 14 hari.')],
        blog=[],
    ),
}

# Pembuka khusus tiap layanan × kota, supaya tiap halaman tidak sekadar ganti nama kota.
INTRO = {
    ('cuci-ac', 'jakarta-selatan'):
        'Teknisi Aslan Teknik datang ke rumah, apartemen, dan kantor di Jakarta Selatan untuk cuci AC menyeluruh. '
        'Dari Kemang dan Senopati sampai Jagakarsa, harganya sama dan sudah jelas sebelum teknisi datang.',
    ('cuci-ac', 'depok'):
        'Butuh cuci AC di Depok? Kami melayani rumah, kost, ruko, dan kantor dari Beji dan Pancoran Mas '
        'sampai Sawangan dan Cinere. Pemilik kost bisa sekaligus mencuci beberapa unit dalam satu kunjungan.',
    ('cuci-ac', 'tangerang-selatan'):
        'Cuci AC untuk rumah, apartemen, dan kantor di Tangerang Selatan: BSD City, Alam Sutera, Serpong, '
        'Bintaro, Pamulang, dan Ciputat. Teknisi datang ke lokasi dengan peralatan cuci lengkap.',
    ('service-ac', 'jakarta-selatan'):
        'AC tidak dingin, mati sendiri, atau berisik di rumah dan kantor Jakarta Selatan? Teknisi kami mengecek '
        'penyebabnya dulu, lalu memberi tahu perbaikan dan harganya sebelum mulai bekerja.',
    ('service-ac', 'depok'):
        'Service dan perbaikan AC di Depok untuk rumah, kost, ruko, dan kantor. Mulai dari pengecekan, sehingga '
        'Anda tahu penyebab masalah dan biayanya sebelum memutuskan perbaikan.',
    ('service-ac', 'tangerang-selatan'):
        'Perbaikan AC di Tangerang Selatan, dari BSD dan Serpong sampai Bintaro dan Pondok Aren. Teknisi '
        'memeriksa unit indoor dan outdoor, lalu menjelaskan perbaikannya dengan harga yang jelas.',
    ('isi-freon-ac', 'jakarta-selatan'):
        'Isi dan tambah freon AC di Jakarta Selatan untuk jenis R22, R32, dan R410. Teknisi mengecek jenis dan '
        'tekanan freon di lokasi, jadi yang diisi sesuai kebutuhan unit Anda.',
    ('isi-freon-ac', 'depok'):
        'AC dingin sebentar lalu hanya meniupkan angin? Kami melayani isi dan tambah freon AC di seluruh area '
        'Depok, dari Cimanggis dan Tapos sampai Bojongsari, untuk rumah, kost, dan ruko.',
    ('isi-freon-ac', 'tangerang-selatan'):
        'Isi freon AC di Tangerang Selatan dengan harga per jenis freon yang tertulis jelas. Melayani rumah, '
        'apartemen, dan kantor di BSD City, Alam Sutera, Serpong, Pamulang, Ciputat, dan Bintaro.',
    ('pasang-ac', 'jakarta-selatan'):
        'Baru membeli AC untuk rumah, apartemen, atau kantor di Jakarta Selatan? Kami memasang unit indoor dan '
        'outdoor lengkap dengan jalur pipa, bobok tembok, dan vacuum.',
    ('pasang-ac', 'depok'):
        'Jasa pasang AC baru di Depok untuk rumah, kamar kost, ruko, dan kantor. Cocok juga untuk pemilik kost '
        'yang menambah AC di beberapa kamar sekaligus.',
    ('pasang-ac', 'tangerang-selatan'):
        'Pasang AC baru di rumah atau apartemen Tangerang Selatan, dari BSD City dan Alam Sutera sampai Bintaro. '
        'Instalasi lengkap dengan vacuum supaya AC langsung dingin maksimal.',
    ('bongkar-pasang-ac', 'jakarta-selatan'):
        'Pindah rumah, apartemen, atau kantor di Jakarta Selatan? Kami membongkar AC di lokasi lama dan '
        'memasangnya kembali di lokasi baru, dengan freon diamankan ke tabung.',
    ('bongkar-pasang-ac', 'depok'):
        'Bongkar pasang AC di Depok untuk pindahan rumah, renovasi, atau pindah kamar kost. Bisa bongkar saja, '
        'atau sekaligus dipasang di lokasi baru.',
    ('bongkar-pasang-ac', 'tangerang-selatan'):
        'Bongkar pasang dan pindah AC di Tangerang Selatan, termasuk perumahan di BSD, Serpong, Pamulang, dan '
        'Bintaro. Freon dikosongkan ke tabung saat dibongkar supaya tidak terbuang.',
}

# Pertanyaan khusus kota (ditambahkan ke FAQ tiap halaman).
CITY_FAQ = {
    'jakarta-selatan': ('Apakah melayani apartemen di Jakarta Selatan?',
                        'Ya. Kami melayani rumah, apartemen, dan kantor di seluruh Jakarta Selatan. Untuk '
                        'apartemen, sebutkan nama gedung saat booking supaya jadwalnya bisa disesuaikan dengan '
                        'aturan pengelola.'),
    'depok': ('Apakah melayani kost dan ruko di Depok?',
              'Ya. Selain rumah dan kantor, kami melayani kost dan ruko di Depok. Untuk banyak unit, sebutkan '
              'jumlahnya saat booking supaya estimasi waktu dan biayanya tepat.'),
    'tangerang-selatan': ('Apakah melayani perumahan dan apartemen di Tangerang Selatan?',
                          'Ya. Kami melayani rumah di perumahan maupun apartemen dan kantor di Tangerang '
                          'Selatan. Sebutkan nama perumahan atau gedung saat booking.'),
}

COLS = ['Split ½–1 PK', 'Split 1½–2 PK', 'Inverter ½–1 PK', 'Inverter 1½–2 PK']


def _fmt(s, **kw):
    return s.format(**kw)


def page(base, prices, svc_slug, city_slug):
    s, c = SERVICES[svc_slug], CITIES[city_slug]
    city = c['name']
    url = f'{SITE}/{city_slug}/{svc_slug}/'
    rows = []
    for r in s['rows']:
        assert r in prices, f'baris "{r}" tidak ada di /pricelist/ (ada: {list(prices)})'
        rows.append((r, *prices[r]))
    mn = min(rp_int(p) for _, _, ps in rows for p in ps)
    vars_ = dict(city=city, min=rp(mn), tempat=c['tempat'], a3=', '.join(c['areas'][:3]),
                 cuci=f'/{city_slug}/cuci-ac/', service=f'/{city_slug}/service-ac/',
                 freon=f'/{city_slug}/isi-freon-ac/')
    title = _fmt(s['title'], **vars_)
    desc = _fmt(s['desc'], **vars_)
    h1 = _fmt(s['h1'], **vars_)

    # tabel harga
    thead = '<tr><th>Jenis pekerjaan</th>' + ''.join(f'<th>{x}</th>' for x in COLS) + '</tr>'
    tbody = ''.join(
        f'<tr><td><strong>{E(n)}</strong><br><span class="note">{E(d)}</span></td>'
        + ''.join(f'<td class="num">{E(p)}</td>' for p in ps) + '</tr>\n'
        for n, d, ps in rows)

    signs = ''.join(f'<li>{x}</li>' for x in s['signs'])
    extra_h, extra_body = s['extra']
    chips = ''.join(f'<li>{a}</li>' for a in c['areas'])
    faqs = [(_fmt(q, **vars_), _fmt(a, **vars_)) for q, a in s['faq']] + [CITY_FAQ[city_slug]]
    faq_html = ''.join(f'<h3>{E(q)}</h3>\n<p>{E(a)}</p>\n' for q, a in faqs)

    other_svcs = ''.join(f'<li><a href="/{city_slug}/{k}/">{v["label"]} {city}</a></li>'
                         for k, v in SERVICES.items() if k != svc_slug)
    other_cities = ''.join(f'<li><a href="/{k}/{svc_slug}/">{s["label"]} {v["name"]}</a></li>'
                           for k, v in CITIES.items() if k != city_slug)
    blog = ''.join(f'<li><a href="{u}">{t}</a></li>' for u, t in s['blog'])

    book_href = '/booking' + (f'?layanan={s["booking"]}' if s['booking'] else '')
    wa_text = f'Halo Aslan Teknik, saya mau {s["kw"]} di {city}'
    wa_href = f'https://wa.me/{WA}?text=' + re.sub(r' ', '%20', wa_text).replace(',', '%2C')

    schema = [
        {'@context': 'https://schema.org', '@type': 'Service', 'name': f'{s["label"]} {city}',
         'serviceType': s['label'], 'url': url, 'description': desc,
         'provider': {'@id': BUSINESS_ID},
         'areaServed': {'@type': 'City', 'name': city},
         'offers': {'@type': 'AggregateOffer', 'priceCurrency': 'IDR', 'lowPrice': mn,
                    'highPrice': max(rp_int(p) for _, _, ps in rows for p in ps),
                    'offerCount': len(rows) * 4}},
        business_schema(),
        {'@context': 'https://schema.org', '@type': 'FAQPage',
         'mainEntity': [{'@type': 'Question', 'name': q,
                         'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faqs]},
        {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Beranda', 'item': f'{SITE}/'},
            {'@type': 'ListItem', 'position': 2, 'name': city, 'item': f'{SITE}/{city_slug}/'},
            {'@type': 'ListItem', 'position': 3, 'name': s['label'], 'item': url}]},
    ]

    head = '\n'.join([
        f'<title>{E(title)}</title>',
        f'<meta name="description" content="{E(desc)}">',
        f'<link rel="canonical" href="{url}">',
        f'<meta property="og:title" content="{E(title)}">',
        f'<meta property="og:description" content="{E(desc)}">',
        f'<meta property="og:url" content="{url}">',
        '<meta property="og:type" content="website">',
        *(ld(x) for x in schema),
    ])

    main = f'''<main>

<article class="article">
  <p class="crumb"><a href="/">Beranda</a> / <a href="/{city_slug}/">{city}</a> / {s["label"]}</p>
  <h1>{h1}</h1>
  <div class="article-body">
    <div class="highlight">
    <strong>Mulai {rp(mn)}</strong> · garansi 14 hari · konfirmasi jadwal lewat WhatsApp dalam 15 menit ·
    buka Senin–Minggu 09.00–16.00 (Jumat libur).
    </div>

    <p>{INTRO[(svc_slug, city_slug)]}</p>

    <h2>Harga {s["kw"]} di {city}</h2>
    <div class="table-scroll"><table>
    {thead}
    {tbody}    </table></div>
    <p class="note">Harga per unit, sudah termasuk jasa teknisi, dan sama untuk seluruh area layanan. Bila kondisi
    di lapangan membutuhkan pekerjaan tambahan, teknisi menyampaikannya lebih dulu sebelum mengerjakan.
    <a href="/pricelist/">Lihat daftar harga lengkap</a>.</p>

    <h2>Yang dikerjakan teknisi</h2>
    {s["what"]}

    <h2>Kapan butuh {s["kw"]}?</h2>
    <ul>{signs}</ul>

    <h2>{extra_h}</h2>
    {_fmt(extra_body, **vars_)}

    <h2>Area {s["kw"]} di {city}</h2>
    <p>Teknisi datang ke {c["tempat"]} di wilayah berikut dan sekitarnya:</p>
    <ul class="area-chips">{chips}</ul>
    <p>Lihat semua layanan kami di <a href="/{city_slug}/">halaman {city}</a>.</p>

    <h2>Cara booking</h2>
    <ol>
    <li>Pilih layanan, jenis AC, dan tanggal di <a href="{book_href}">form booking</a>.</li>
    <li>Kami konfirmasi jadwal lewat WhatsApp dalam 15 menit (pada jam buka).</li>
    <li>Teknisi datang, mengerjakan, dan Anda membayar sesuai harga yang sudah disepakati.</li>
    </ol>

    <h2>Pertanyaan yang sering diajukan</h2>
{faq_html}
    <h2>Layanan lain di {city}</h2>
    <ul>{other_svcs}</ul>
    <h2>{s["label"]} di kota lain</h2>
    <ul>{other_cities}</ul>
{f"    <h2>Bacaan terkait</h2>{chr(10)}    <ul>{blog}</ul>" if blog else ""}
  </div>
  <div class="cta-band article-cta">
    <h2>Jadwalkan {s["kw"]} di {city}</h2>
    <p>Pilih tanggal lewat form booking, atau tanya dulu lewat WhatsApp.</p>
    <div class="pactions">
      <a href="{book_href}" class="btn btn-brand">Booking {s["kw"]}</a>
      <a href="{wa_href}" target="_blank" rel="noopener" class="btn btn-line">Tanya lewat WhatsApp</a>
    </div>
  </div>
</article>

</main>'''

    out = re.sub(r'<title>.*?<meta property="article:published_time"[^>]*>', lambda m: head, base,
                 count=1, flags=re.S)
    out = out.replace(' aria-current="page"', '')
    out, n = re.subn(r'<main>.*?</main>', lambda m: main, out, count=1, flags=re.S)
    assert n == 1 and '<title>' + E(title) in out, 'template blog berubah, sesuaikan tools/layanan.py'
    return out


def city_links_section(city_slug):
    """Blok tautan ke 5 halaman layanan, disisipkan di halaman kota."""
    city = CITIES[city_slug]['name']
    items = ''.join(f'<li><a href="/{city_slug}/{k}/">{v["label"]} {city}</a></li>'
                    for k, v in SERVICES.items())
    return f'''<p class="sec-lead" style="margin-top:20px">Detail harga per layanan di {city}:</p>
      <ul class="area-chips svc-links">{items}</ul>'''


def build(root):
    base = (root / 'blog' / '_template' / 'index.html').read_text(encoding='utf-8')
    prices = read_prices((root / 'pricelist' / 'index.html').read_text(encoding='utf-8'))
    urls = []
    for city_slug in CITIES:
        for svc_slug in SERVICES:
            d = root / city_slug / svc_slug
            d.mkdir(parents=True, exist_ok=True)
            (d / 'index.html').write_text(page(base, prices, svc_slug, city_slug), encoding='utf-8')
            urls.append((f'/{city_slug}/{svc_slug}/', f'{city_slug}/{svc_slug}/index.html'))
    print('layanan:', len(urls), 'halaman')
    return urls
