#!/usr/bin/env python3
"""Bangun ulang halaman turunan situs aslanteknik.id.

Jalankan dari root repo:  python3 tools/build.py

Yang dibuat ulang:
  - /jakarta-selatan/, /depok/, /tangerang-selatan/  (turunan dari /index.html,
    jadi tampilan, harga, dan form selalu sama dengan beranda)
  - daftar artikel di /blog/index.html (dibaca dari tiap /blog/<slug>/index.html)
  - /sitemap.xml

Jalankan lagi setiap kali beranda berubah atau ada artikel blog baru.
"""
import datetime
import html
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://aslanteknik.id'
BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
         'Agustus', 'September', 'Oktober', 'November', 'Desember']

CITIES = {
    'jakarta-selatan': dict(
        name='Jakarta Selatan',
        title='Cuci AC Jakarta Selatan — Jasa Service AC Jaksel | Aslan Teknik',
        desc='Jasa cuci AC dan service AC Jakarta Selatan. Cuci AC mulai Rp110.000, garansi 14 hari. '
             'Melayani Kemang, Tebet, Kebayoran Baru, Fatmawati, Cipete, Pondok Indah, Cilandak, dan sekitarnya.',
        keywords='cuci AC Jakarta Selatan, service AC Jaksel, teknisi AC Jakarta Selatan, jasa AC Kemang, '
                 'cuci AC Tebet, service AC Kebayoran, isi freon Jakarta Selatan, bongkar pasang AC Jaksel',
        sub='Cuci, perbaikan, isi freon, dan bongkar pasang AC untuk rumah, apartemen, dan kantor di '
            'Kemang, Tebet, Kebayoran Baru, Fatmawati, Cipete, Pondok Indah, Cilandak, dan sekitarnya.',
        areas=['Kemang', 'Tebet', 'Kebayoran Baru', 'Fatmawati', 'Cipete', 'Pondok Indah', 'Cilandak',
               'Mampang', 'Jagakarsa', 'Blok M', 'Senopati'],
    ),
    'depok': dict(
        name='Depok',
        title='Servis AC Depok — Cuci AC Depok | Aslan Teknik',
        desc='Jasa cuci AC dan servis AC di Depok. Cuci AC mulai Rp110.000, garansi 14 hari. '
             'Melayani Beji, Pancoran Mas, Sawangan, Cinere, Cimanggis, dan sekitarnya.',
        keywords='servis AC Depok, cuci AC Depok, teknisi AC Depok, isi freon Depok, bongkar pasang AC Depok',
        sub='Cuci, perbaikan, isi freon, dan bongkar pasang AC untuk rumah, kost, ruko, dan kantor di '
            'Beji, Pancoran Mas, Sawangan, Cinere, Cimanggis, dan sekitarnya.',
        areas=['Beji', 'Pancoran Mas', 'Sawangan', 'Cinere', 'Cimanggis', 'Sukmajaya', 'Tapos',
               'Cilodong', 'Bojongsari'],
    ),
    'tangerang-selatan': dict(
        name='Tangerang Selatan',
        title='Servis AC Tangerang Selatan — Cuci AC Tangsel | Aslan Teknik',
        desc='Jasa cuci AC dan servis AC Tangerang Selatan. Cuci AC mulai Rp110.000, garansi 14 hari. '
             'Melayani BSD City, Alam Sutera, Serpong, Pamulang, Ciputat, Bintaro, dan sekitarnya.',
        keywords='servis AC Tangerang Selatan, cuci AC Tangsel, teknisi AC BSD, cuci AC Bintaro, '
                 'isi freon Tangsel, bongkar pasang AC Tangerang Selatan',
        sub='Cuci, perbaikan, isi freon, dan bongkar pasang AC untuk rumah, apartemen, dan kantor di '
            'BSD City, Alam Sutera, Serpong, Pamulang, Ciputat, Bintaro, dan sekitarnya.',
        areas=['BSD City', 'Alam Sutera', 'Serpong', 'Pamulang', 'Ciputat', 'Pondok Aren', 'Bintaro'],
    ),
}


def rep(s, old, new, n=1):
    assert s.count(old) == n, f'pola tidak cocok ({s.count(old)}x, harap {n}x): {old[:70]!r}'
    return s.replace(old, new)


def build_cities():
    home = (ROOT / 'index.html').read_text(encoding='utf-8')
    for slug, c in CITIES.items():
        name, url = c['name'], f'{SITE}/{slug}/'
        s = home
        head = re.search(r'<title>.*?<meta property="og:url"[^>]*>', s, re.S)
        assert head, 'blok <title>…og:url di beranda tidak ditemukan'
        e = html.escape
        s = s.replace(head.group(0), '\n'.join([
            f'<title>{e(c["title"])}</title>',
            f'<meta name="description" content="{e(c["desc"])}">',
            f'<meta name="keywords" content="{e(c["keywords"])}">',
            f'<link rel="canonical" href="{url}">',
            f'<meta property="og:title" content="{e(c["title"])}">',
            f'<meta property="og:description" content="{e(c["desc"])}">',
            '<meta property="og:type" content="website">',
            f'<meta property="og:url" content="{url}">']))
        s = rep(s, '<a class="nav-logo" href="#">', '<a class="nav-logo" href="/">')
        s = rep(s, '<h1>Servis AC ke rumah, harga jelas sejak awal.</h1>',
                f'<h1>Servis AC {name}, harga jelas sejak awal.</h1>')
        s = re.sub(r'<p class="hero-sub">.*?</p>', f'<p class="hero-sub">{c["sub"]}</p>', s, count=1, flags=re.S)
        s = rep(s, '<h2>Layanan dan harga</h2>', f'<h2>Layanan servis AC di {name}</h2>')
        s = rep(s, '<h2>Booking servis AC</h2>', f'<h2>Booking servis AC di {name}</h2>')
        chips = ''.join(f'<li>{a}</li>' for a in c['areas'])
        s = rep(s, '<!-- CARA KERJA -->', f'''<!-- AREA {name.upper()} -->
<section class="sec sec-tint" id="area" style="padding-bottom:0">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:0">
      <h2>Area servis AC di {name}</h2>
      <p class="sec-lead">Teknisi kami datang ke rumah, apartemen, kantor, dan tempat usaha di wilayah berikut dan sekitarnya.</p>
      <ul class="area-chips">{chips}</ul>
    </div>
  </div>
</section>

<!-- CARA KERJA -->''')
        s = rep(s, 'autocomplete="address-level2" placeholder="Depok"',
                f'autocomplete="address-level2" placeholder="{name}"')
        # Halaman kota hanya menampilkan review asli dari database (tanpa contoh bawaan).
        s = re.sub(r'var PAGE_STATIC_REVIEWS = \[.*?\];', 'var PAGE_STATIC_REVIEWS = [];', s, count=1, flags=re.S)
        (ROOT / slug).mkdir(exist_ok=True)
        (ROOT / slug / 'index.html').write_text(s, encoding='utf-8')
        print('kota   :', f'/{slug}/')


def read_posts():
    posts = []
    for f in sorted((ROOT / 'blog').glob('*/index.html')):
        t = f.read_text(encoding='utf-8')
        if 'name="robots" content="noindex' in t:
            continue
        get = lambda pat: (re.search(pat, t, re.S) or [None, ''])[1].strip()
        date = get(r'<meta property="article:published_time" content="(\d{4}-\d{2}-\d{2})')
        title = get(r'<h1[^>]*>(.*?)</h1>') or get(r'<title>(.*?)</title>')
        assert date and title, f'{f}: butuh <h1> dan <meta property="article:published_time" content="YYYY-MM-DD">'
        posts.append(dict(slug=f.parent.name, date=date, title=re.sub(r'<[^>]+>', '', title),
                          desc=get(r'<meta name="description" content="(.*?)"')))
    return sorted(posts, key=lambda p: p['date'], reverse=True)


def build_blog_list(posts):
    p = ROOT / 'blog' / 'index.html'
    s = p.read_text(encoding='utf-8')
    cards = ''
    for a in posts:
        y, m, d = map(int, a['date'].split('-'))
        cards += f'''      <a class="post-card" href="/blog/{a['slug']}/">
        <time datetime="{a['date']}">{d} {BULAN[m - 1]} {y}</time>
        <h2>{a['title']}</h2>
        <p>{a['desc']}</p>
      </a>
'''
    s2, n = re.subn(r'(<!-- ARTIKEL:START[^>]*-->\n).*?(\s*<!-- ARTIKEL:END -->)',
                    lambda m: m.group(1) + cards.rstrip('\n') + m.group(2), s, flags=re.S)
    assert n == 1, 'penanda ARTIKEL:START / ARTIKEL:END di /blog/index.html tidak ditemukan'
    p.write_text(s2, encoding='utf-8')
    print('blog   :', len(posts), 'artikel')


def lastmod(path):
    """Tanggal commit terakhir file (fallback: hari ini untuk file yang belum di-commit)."""
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', str(path)], cwd=ROOT,
                             capture_output=True, text=True).stdout.strip()
        dirty = subprocess.run(['git', 'status', '--porcelain', '--', str(path)], cwd=ROOT,
                               capture_output=True, text=True).stdout.strip()
        if out and not dirty:
            return out
    except OSError:
        pass
    return datetime.date.today().isoformat()


def build_sitemap(posts):
    pages = [('/', 'index.html', '1.0'), ('/booking', 'booking/index.html', '0.9'),
             ('/pricelist/', 'pricelist/index.html', '0.8'), ('/acfinder/', 'acfinder/index.html', '0.6'),
             ('/jakarta-selatan/', 'jakarta-selatan/index.html', '0.8'), ('/depok/', 'depok/index.html', '0.8'),
             ('/tangerang-selatan/', 'tangerang-selatan/index.html', '0.8'), ('/blog/', 'blog/index.html', '0.7')]
    pages += [(f'/blog/{a["slug"]}/', f'blog/{a["slug"]}/index.html', '0.6') for a in posts]
    rows = ''.join(f'  <url><loc>{SITE}{u}</loc><lastmod>{lastmod(f)}</lastmod><priority>{pr}</priority></url>\n'
                   for u, f, pr in pages)
    (ROOT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + rows + '</urlset>\n', encoding='utf-8')
    print('sitemap:', len(pages), 'URL')


if __name__ == '__main__':
    build_cities()
    posts = read_posts()
    build_blog_list(posts)
    build_sitemap(posts)
