#!/usr/bin/env python3
"""Buat artikel blog dari file HTML/teks kiriman penulis.

Pakai:  python3 tools/new_post.py <file-sumber> <slug> <YYYY-MM-DD> [--wa "teks pesan WhatsApp"]

File sumber cukup berisi <title>, <meta name="description">, <h1>, lalu isi artikel
(h2, p, ul, table, dll). Menu, footer, gaya, dan ajakan booking diambil dari
blog/_template/. Setelah itu jalankan tools/build.py untuk memperbarui daftar
blog dan sitemap.
"""
import argparse
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://aslanteknik.id'
BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
         'Agustus', 'September', 'Oktober', 'November', 'Desember']
WA = 'https://wa.me/62895326105290'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('slug')
    ap.add_argument('date')
    ap.add_argument('--wa', default='Halo Aslan Teknik, saya mau booking servis AC')
    ap.add_argument('--minutes', type=int, default=0, help='perkiraan menit baca (0 = hitung otomatis)')
    a = ap.parse_args()
    assert re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', a.slug), 'slug harus huruf kecil dan tanda hubung'
    assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', a.date), 'tanggal harus YYYY-MM-DD'

    src = pathlib.Path(a.src).read_text(encoding='utf-8')
    get = lambda pat: (re.search(pat, src, re.S | re.I) or [None, ''])[1].strip()
    h1 = get(r'<h1[^>]*>(.*?)</h1>')
    title = get(r'<title>(.*?)</title>')
    title = re.sub(r'\s*\|\s*Aslan Teknik\s*$', '', title) or h1
    desc = get(r'<meta name="description" content="(.*?)"')
    assert h1 and desc, 'file sumber butuh <h1> dan <meta name="description">'

    body = get(r'<h1[^>]*>.*?</h1>(.*?)(?:</article>|</main>|</body>)')
    body = re.sub(r'<p class="(?:meta|breadcrumb)">.*?</p>', '', body, flags=re.S)
    body = re.sub(r'<div class="cta">.*?</div>', '', body, flags=re.S)
    # tautan ke situs sendiri → relatif; teks tautan yang berupa URL mentah → teks biasa
    body = re.sub(r'href="https?://(?:www\.)?aslanteknik\.id(/[^"]*)"', r'href="\1"', body)
    body = re.sub(r'(<a [^>]*>)https?://(?:www\.)?aslanteknik\.id/pricelist/?(</a>)', r'\1daftar harga\2', body)
    body = re.sub(r'(<a [^>]*>)https?://(?:www\.)?aslanteknik\.id/booking/?(</a>)', r'\1form booking\2', body)
    body = re.sub(r'(<a href="https://wa\.me[^"]*")(?![^>]*target=)', r'\1 target="_blank" rel="noopener"', body)
    body = re.sub(r'<table\b.*?</table>', lambda m: '<div class="table-scroll">' + m.group(0) + '</div>', body, flags=re.S)
    body = '\n'.join('    ' + l.strip() for l in body.strip().splitlines() if l.strip())
    for bad in ('ogor', 'www.aslanteknik', 'aslanteknik.com'):
        assert bad not in body, f'isi artikel masih memuat "{bad}"'

    words = len(re.sub(r'<[^>]+>', ' ', body).split())
    minutes = a.minutes or max(1, round(words / 200))
    y, m, d = map(int, a.date.split('-'))
    url = f'{SITE}/blog/{a.slug}/'
    e = lambda s: html.escape(html.unescape(s))
    ld = json.dumps({
        '@context': 'https://schema.org', '@type': 'Article', 'headline': html.unescape(h1),
        'description': html.unescape(desc), 'inLanguage': 'id-ID', 'datePublished': a.date,
        'dateModified': a.date, 'mainEntityOfPage': url,
        'author': {'@type': 'Organization', 'name': 'Aslan Teknik', 'url': SITE + '/'},
        'publisher': {'@type': 'Organization', 'name': 'Aslan Teknik', 'url': SITE + '/'},
    }, ensure_ascii=False, indent=2)

    t = (ROOT / 'blog' / '_template' / 'index.html').read_text(encoding='utf-8')
    reps = [
        ('<title>JUDUL ARTIKEL — Aslan Teknik</title>', f'<title>{e(title)} | Aslan Teknik</title>', 1),
        ('<meta property="og:title" content="JUDUL ARTIKEL — Aslan Teknik">', f'<meta property="og:title" content="{e(title)}">', 1),
        ('content="RINGKASAN 140–160 KARAKTER, dipakai di Google dan di daftar /blog/."', f'content="{e(desc)}"', 2),
        (f'{SITE}/blog/SLUG/', url, 2),
        ('<!-- HAPUS baris noindex di bawah ini pada artikel sungguhan -->\n<meta name="robots" content="noindex">\n', '', 1),
        ('<meta property="article:published_time" content="2026-01-01">',
         f'<meta property="article:published_time" content="{a.date}">\n<script type="application/ld+json">\n{ld}\n</script>', 1),
        ('<h1>JUDUL ARTIKEL</h1>', f'<h1>{h1}</h1>', 1),
        ('<time datetime="2026-01-01">1 Januari 2026</time>, oleh Tim Aslan Teknik',
         f'<time datetime="{a.date}">{d} {BULAN[m - 1]} {y}</time>, oleh Tim Aslan Teknik · {minutes} menit baca', 1),
        ('<a href="/pricelist/" class="btn btn-line">Lihat daftar harga</a>',
         f'<a href="{WA}?text={html.escape(re.sub(" ", "%20", a.wa.replace(",", "%2C")))}" target="_blank" rel="noopener" class="btn btn-line">Tanya lewat WhatsApp</a>', 1),
    ]
    for old, new, n in reps:
        assert t.count(old) == n, f'template berubah, pola tidak ditemukan: {old[:50]!r}'
        t = t.replace(old, new)
    t, n = re.subn(r'(<div class="article-body">\n).*?(\n  </div>\n  <div class="cta-band)',
                   lambda mm: mm.group(1) + body + mm.group(2), t, count=1, flags=re.S)
    assert n == 1
    out = ROOT / 'blog' / a.slug / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(t, encoding='utf-8')
    print('artikel:', f'/blog/{a.slug}/', f'({words} kata, {minutes} menit baca)')


if __name__ == '__main__':
    main()
