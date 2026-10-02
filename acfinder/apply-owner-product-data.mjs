#!/usr/bin/env node
// Penerapan data lengkap yang diberikan pemilik Aslan Teknik.
// Setiap atribut diberi catatan asal eksplisit. Tidak mengarang metadata.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateInventory} from './inventory.mjs';
import {categorizeBudget} from './engine.mjs';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'products.json');
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const get = id => {
  const p = rows.find(r => r.product_id === id);
  if (!p) throw Error(`ID tidak ditemukan: ${id}`);
  return p;
};
const NOTE = 'Data merek, model, PK, jenis, BTU/h, watt, dan harga acuan diberikan langsung oleh pemilik Aslan Teknik; tidak diverifikasi mandiri dari halaman Shopee publik. Konfirmasi harga dan varian di Shopee sebelum checkout.';
const now = new Date().toISOString();

function set(id, d) {
  const p = get(id);
  Object.assign(p, d);
  p.budget_category = p.price == null ? null : categorizeBudget(p.price);
  p.verification_notes = NOTE;
  p.verification_status = 'verified';
  p.last_checked = now;
  p.active = true;
}

// ── AQUA ──────────────────────────────────────────────────────────────────
set('shopee-001', {
  brand: 'AQUA', model: 'AQA-KCR05FQDL / KCR5FQAL', product_name: 'AQUA AQA-KCR05FQDL / KCR5FQAL — ½ PK Non-Inverter',
  pk: 0.5, inverter: false, price: 2500000,
  specifications: {cooling_btu_h: 5000, power_watt: 360, room_area_m2_up_to: 10},
  source_url: 'https://shopee.co.id/opaanlp/243117622/29255617981',
});
set('shopee-016', {
  brand: 'AQUA', model: 'AQA-KCR5VRAL2', product_name: 'AQUA AQA-KCR5VRAL2 — ½ PK Inverter',
  pk: 0.5, inverter: true, price: 4600000,
  specifications: {cooling_btu_h: 9100, power_watt: 870},
  source_url: 'https://shopee.co.id/opaanlp/42079199/27150002972',
});
set('shopee-017', {
  brand: 'AQUA', model: 'AQA-KCR09FQDL / KCR9FQAL', product_name: 'AQUA AQA-KCR09FQDL / KCR9FQAL — 1 PK Non-Inverter',
  pk: 1, inverter: false, price: 2900000,
  specifications: {cooling_btu_h: 9000, power_watt: 760},
  source_url: 'https://shopee.co.id/opaanlp/19109964/43712077230',
});

// ── TCL ───────────────────────────────────────────────────────────────────
set('shopee-003', {
  brand: 'TCL', model: 'TAC-05CSD/XB', product_name: 'TCL TAC-05CSD/XB — ½ PK Non-Inverter',
  pk: 0.5, inverter: false, price: 2800000,
  specifications: {cooling_btu_h: 5000, power_watt: 330},
  source_url: 'https://shopee.co.id/opaanlp/227074971/24070422485',
});
set('shopee-004', {
  brand: 'TCL', model: 'TAC-05CSV/ZB2', product_name: 'TCL TAC-05CSV/ZB2 — ½ PK Inverter',
  pk: 0.5, inverter: true, price: 3500000,
  specifications: {cooling_btu_h: 5000, power_watt: 385},
  source_url: 'https://shopee.co.id/opaanlp/227074971/46612372033',
});
set('shopee-005', {
  brand: 'TCL', model: 'TAC-09CSD/XSS', product_name: 'TCL TAC-09CSD/XSS — 1 PK Non-Inverter',
  pk: 1, inverter: false, price: 3300000,
  specifications: {cooling_btu_h: 9000, power_watt: 790},
  source_url: 'https://shopee.co.id/opaanlp/227074971/23473565669',
});

// ── FLIFE — satu tautan afiliasi, tiga varian PK ──────────────────────────
set('shopee-007', {
  brand: 'FLIFE', model: 'FAC-05FLOO', product_name: 'FLIFE FAC-05FLOO — ½ PK Non-Inverter',
  pk: 0.5, inverter: false, price: 3000000,
  specifications: {cooling_btu_h: 5200, power_watt: 380},
  source_url: 'https://shopee.co.id/opaanlp/466645045/25264061335',
});
const flifeBase = get('shopee-007');
for (const v of [
  {suffix: '1pk', model: 'FAC-09FLOO', name: 'FLIFE FAC-09FLOO — 1 PK Non-Inverter', pk: 1, price: 3600000, btu: 9500, watt: 720},
  {suffix: '2pk', model: 'FAC-18FLOO', name: 'FLIFE FAC-18FLOO — 2 PK Non-Inverter', pk: 2, price: 6200000, btu: 18500, watt: 1450},
]) {
  const id = `shopee-007-${v.suffix}`;
  const rec = {
    ...flifeBase, product_id: id, variant_of: 'shopee-007',
    model: v.model, product_name: v.name, pk: v.pk, inverter: false, price: v.price,
    budget_category: categorizeBudget(v.price),
    specifications: {cooling_btu_h: v.btu, power_watt: v.watt},
    verification_status: 'verified', verification_notes: NOTE, last_checked: now, active: true,
  };
  const idx = rows.findIndex(r => r.product_id === id);
  if (idx >= 0) rows[idx] = rec; else rows.push(rec);
}

// ── GREE ──────────────────────────────────────────────────────────────────
set('shopee-010', {
  brand: 'Gree', model: '05N1(A)', product_name: 'Gree 05N1(A) — ½ PK Non-Inverter',
  pk: 0.5, inverter: false, price: 3600000,
  specifications: {cooling_btu_h: 5000, power_watt: 385},
  source_url: 'https://shopee.co.id/opaanlp/57328541/28423346555',
});
set('shopee-011', {
  brand: 'Gree', model: 'GWC-05F5S', product_name: 'Gree GWC-05F5S — ½ PK Inverter',
  pk: 0.5, inverter: true, price: 4900000,
  specifications: {cooling_btu_h: 5000, power_watt: 350},
  source_url: 'https://shopee.co.id/opaanlp/57328541/21057416675',
});
set('shopee-018', {
  brand: 'Gree', model: 'GWC-09C3E(S)', product_name: 'Gree GWC-09C3E(S) — 1 PK Non-Inverter',
  pk: 1, inverter: false, price: 4600000,
  specifications: {cooling_btu_h: 9000, power_watt: 690},
  source_url: 'https://shopee.co.id/opaanlp/57328541/3440906108',
});
set('shopee-019', {
  brand: 'Gree', model: 'GWC-18F5S', product_name: 'Gree GWC-18F5S — 2 PK Inverter',
  pk: 2, inverter: true, price: 8700000,
  specifications: {cooling_btu_h: 17000, power_watt: 1500},
  source_url: 'https://shopee.co.id/opaanlp/57328541/20057427392',
});

// ── Pensiunkan varian lama AQUA 1 PK yang tidak ada di data baru ──────────
const stale = get('shopee-001-1pk');
stale.active = false;
stale.verification_notes = 'Dinonaktifkan: digantikan varian AQUA 1 PK (shopee-017) sesuai data pemilik terbaru.';

const errors = validateInventory(rows);
if (errors.length) throw Error(errors.join('\n'));
fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');

const verified = rows.filter(r => r.verification_status === 'verified' && r.active);
console.log(`total=${rows.length} aktif_terverifikasi=${verified.length}`);
console.log('--- entri terverifikasi ---');
for (const r of verified) console.log(`${r.product_id}\t${r.brand} ${r.model}\t${r.pk}PK\tinv=${r.inverter}\tRp${r.price}\t${r.budget_category}`);
