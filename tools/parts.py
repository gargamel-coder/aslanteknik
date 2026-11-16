"""Potongan HTML bersama (nav, footer, head) untuk halaman selain beranda.
Dipakai oleh tools/build.py."""
CSS_V = '4'
JS_V = '3'

HEAD_ASSETS = f'''<link rel="icon" href="/favicon.ico?v=6" type="image/x-icon">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=6">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=6">
<link rel="manifest" href="/site.webmanifest?v=6">
<meta name="theme-color" content="#4A3FE0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/aslan.css?v={CSS_V}">'''

def nav(current=''):
    def a(href, label):
        cur = ' aria-current="page"' if href == current else ''
        return f'<a href="{href}"{cur}>{label}</a>'
    links = [('/#layanan', 'Layanan'), ('/pricelist/', 'Daftar harga'), ('/acfinder/', 'AC Finder'),
             ('/blog/', 'Blog'), ('/#lokasi', 'Lokasi')]
    return f'''<header class="nav">
  <div class="wrap">
    <div class="nav-in">
      <a class="nav-logo" href="/">Aslan<span>.</span>Teknik</a>
      <nav class="nav-links" aria-label="Menu utama">
        {chr(10).join('        ' + a(h, l) for h, l in links).strip()}
      </nav>
      <button class="nav-menu" type="button" aria-expanded="false" aria-controls="nav-drawer">Menu</button>
      <a class="nav-cta" href="/booking">Booking<span class="nav-cta-x">&nbsp;servis</span></a>
    </div>
    <div class="nav-drawer" id="nav-drawer">
      <a href="/">Beranda</a>
      {chr(10).join('      ' + a(h, l) for h, l in links).strip()}
    </div>
  </div>
</header>'''

FOOTER = '''<footer class="foot">
  <div class="wrap">
    <div class="foot-g">
      <div>
        <span class="foot-logo">Aslan<span>.</span>Teknik</span>
        <p>Perawatan dan perbaikan AC untuk rumah, kantor, dan tempat usaha di Jakarta Selatan, Depok, dan Tangerang Selatan.</p>
      </div>
      <div class="foot-col">
        <h4>Layanan</h4>
        <a href="/#layanan">Cuci AC</a><a href="/#layanan">Isi Freon</a>
        <a href="/#layanan">Bongkar Pasang</a><a href="/#layanan">Perbaikan AC</a>
        <a href="/pricelist/">Daftar harga</a>
        <a href="/blog/">Blog</a>
      </div>
      <div class="foot-col">
        <h4>Area layanan</h4>
        <a href="/jakarta-selatan/">Jakarta Selatan</a><a href="/depok/">Depok</a>
        <a href="/tangerang-selatan/">Tangerang Selatan</a>
      </div>
      <div class="foot-col">
        <h4>Jam buka</h4>
        <span>Senin sampai Minggu, 09.00–16.00</span>
        <span>Jumat libur</span>
      </div>
    </div>
    <div class="foot-bot">
      <span>© 2024–<span class="yr">2026</span> Aslan Teknik. Semua hak dilindungi.</span>
      <span>Dibuat untuk pelanggan setia kami</span>
    </div>
  </div>
</footer>
<script>document.querySelectorAll('.yr').forEach(function(e){e.textContent=new Date().getFullYear()});</script>
<script src="/assets/aslan.js?v=''' + JS_V + '''"></script>'''
