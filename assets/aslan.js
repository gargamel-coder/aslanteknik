/* Aslan Teknik — pelengkap UX halaman utama & /booking.
   Dimuat SETELAH skrip utama halaman. Logika harga, kalender, voucher, dan
   pengiriman order tetap di skrip halaman; file ini hanya menambah:
   menu HP, ringkasan pesanan (nota),
   bar total di HP, dan gulir ke isian yang belum lengkap. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  // ── Menu navigasi di HP ──
  var nav = document.querySelector('.nav');
  var menuBtn = document.querySelector('.nav-menu');
  if (nav && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav-drawer a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Form booking ──
  if (typeof window.upd !== 'function' || typeof window.sendWA !== 'function' || !$('f-ac')) return;

  var acSel = $('f-ac');
  var bar = $('bk-bar');
  var waBtn = $('wa-btn');
  var ctaVisible = false;
  var missingShown = false;

  function svcKeys() { return Object.keys(window.selSvc || {}); }

  function dateText() {
    var d = window.selDate;
    return d ? DAY[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear() : '';
  }

  function totals() {
    var res = calcPrice();
    var v = window.appliedVoucher;
    var disc = 0;
    if (v) disc = v.type === 'percent' ? Math.round(res.total * v.value / 100) : Math.min(res.total, v.value);
    return { total: res.total, final: res.total - disc };
  }

  function missingParts() {
    var val = function (id) { return ($(id).value || '').trim(); };
    var m = [];
    if (!svcKeys().length) m.push('layanan');
    if (!acSel.value) m.push('jenis AC');
    if (!window.selDate) m.push('tanggal');
    if (!val('f-name')) m.push('nama');
    if (!val('f-wa')) m.push('nomor WhatsApp');
    if (!val('f-city')) m.push('kota');
    if (!val('f-addr')) m.push('alamat');
    return m;
  }

  function setText(id, text, unset) {
    var el = $(id);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('unset', !!unset);
  }

  function toggleDone(id, done) {
    var el = $(id);
    if (el) el.classList.toggle('done', !!done);
  }

  function sync() {
    var ac = acSel.value;
    var keys = svcKeys();

    document.querySelectorAll('.chip[data-k]').forEach(function (chip) {
      chip.setAttribute('aria-pressed', String(chip.classList.contains('act')));
    });

    // Harga baru ditampilkan setelah jenis AC dipilih
    var bk = document.querySelector('.bk');
    if (bk) bk.classList.toggle('no-ac', !ac);
    var needAc = $('nota-need-ac');
    if (needAc) needAc.hidden = !(keys.length > 0 && !ac);

    // Nota
    var empty = $('nota-empty');
    if (empty) empty.hidden = keys.length > 0;
    setText('nota-ac', ac ? acSel.options[acSel.selectedIndex].text : 'Belum dipilih', !ac);
    var dt = dateText();
    setText('nota-date', dt || 'Belum dipilih', !dt);
    var picked = $('picked-date');
    if (picked) picked.textContent = dt ? 'Dipilih: ' + dt : '';

    // Tanda langkah selesai
    var val = function (id) { return ($(id).value || '').trim(); };
    toggleDone('step-svc', keys.length > 0);
    toggleDone('step-ac', !!ac);
    toggleDone('step-date', !!window.selDate);
    toggleDone('step-contact', val('f-name') && val('f-wa') && val('f-city') && val('f-addr'));

    // Bar total (HP)
    if (bar) {
      var t = totals();
      $('bk-bar-total').textContent = ac ? fmt(t.final) : 'Pilih jenis AC';
      var miss = missingShown ? missingParts() : [];
      var lbl = $('bk-bar-lbl');
      lbl.textContent = miss.length ? 'Lengkapi: ' + miss.join(', ') : 'Estimasi untuk ' + keys.length + ' layanan';
      lbl.classList.toggle('warn', miss.length > 0);
      var show = keys.length > 0 && !ctaVisible;
      bar.hidden = !show;
      document.body.classList.toggle('has-bk-bar', show);
    }

    if (missingShown) renderMissing(false);
  }

  function renderMissing(scroll) {
    var box = $('bk-missing');
    var m = missingParts();
    missingShown = m.length > 0;
    if (box) {
      box.textContent = m.length ? 'Belum lengkap: ' + m.join(', ') + '.' : '';
      box.classList.toggle('show', m.length > 0);
    }
    if (!scroll || !m.length) return;
    var steps = document.querySelectorAll('.bk-step');
    for (var i = 0; i < steps.length; i++) {
      var bad = steps[i].querySelector('.err-field, .err-msg.show, .chip-err.show');
      if (!bad) continue;
      steps[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
      var field = steps[i].querySelector('input.err-field, textarea.err-field');
      if (field) setTimeout(function () { field.focus({ preventScroll: true }); }, 450);
      break;
    }
  }

  // Sisipkan sync() setelah fungsi halaman yang mengubah keadaan form.
  ['upd', 'updDiscountDisplay', 'removeVoucher'].forEach(function (name) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      var out = orig.apply(this, arguments);
      sync();
      return out;
    };
  });

  // Kirim: kalau belum lengkap, tunjukkan apa yang kurang dan gulir ke sana.
  // Tetap sinkron agar window.open di sendWA asli tidak diblokir browser.
  var origSend = window.sendWA;
  window.sendWA = function () {
    if (!validateAll()) { renderMissing(true); sync(); return; }
    renderMissing(false);
    sync();
    origSend();
  };

  // Pilih layanan dari bagian lain halaman (mis. daftar harga), lalu ke form.
  window.goBookWith = function (k) {
    var chip = k ? document.querySelector('.chip[data-k="' + k + '"]') : null;
    if (chip && !chip.classList.contains('act')) toggleChip(chip);
    if (typeof window.goBook === 'function') window.goBook();
    else if ($('booking')) $('booking').scrollIntoView({ behavior: 'smooth' });
  };

  // /booking/?layanan=cuci → layanan langsung terpilih
  try {
    var pre = new URLSearchParams(location.search).get('layanan');
    if (pre) {
      var preChip = document.querySelector('.chip[data-k="' + pre.replace(/[^a-zA-Z0-9]/g, '') + '"]');
      if (preChip && !preChip.classList.contains('act')) toggleChip(preChip);
    }
  } catch (e) {}

  if (waBtn && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      ctaVisible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.6 }).observe(waBtn);
  }

  sync();
})();
