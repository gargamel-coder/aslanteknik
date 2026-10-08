const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function check(page) {
  const html = fs.readFileSync(page, 'utf8');
  const fn = html.match(/function _loadAvailability\(\) \{[\s\S]*?\n\}/);
  const change = html.match(/function chMon\(dir\) \{[\s\S]*?\n\}/);
  assert(fn && change, 'fungsi kalender ditemukan');
  const pending = [];
  const ctx = {
    curYr: 2026, curMon: 9, availabilityMap: {},
    window: {
      _fbDb: {}, _fbGetDocs(q) { return new Promise((resolve, reject) => pending.push({q, resolve, reject})); },
      _fbCollection(db, name) { return name; },
      _fbQuery(col, ...filters) { return {col, filters}; },
      _fbWhere(field, op, value) { return {field, op, value}; }
    },
    document: { getElementById() { return {classList: {remove() {}}}; } },
    renderCal() { ctx.renders++; }, renders: 0, Date, String, Object, console
  };
  vm.createContext(ctx);
  vm.runInContext(fn[0] + '\n' + change[0], ctx);
  const settle = () => new Promise(resolve => setImmediate(resolve));
  ctx._loadAvailability();
  assert.equal(pending.length, 1, 'bulan awal meminta data');
  assert.equal(pending[0].q.col, 'calendar_availability');
  assert.deepEqual(Array.from(pending[0].q.filters, f => [f.field, f.op, f.value]),
    [['__name__', '>=', '2026-10-01'], ['__name__', '<=', '2026-10-31']], 'query hanya Oktober');
  ctx.chMon(1);
  assert.equal(pending.length, 2, 'perpindahan bulan meminta data baru');
  assert.deepEqual(Array.from(pending[1].q.filters, f => f.value), ['2026-11-01', '2026-11-30']);
  pending[1].resolve({docs:[{id:'2026-11-12', data:()=>({status:'full_booked'})}]});
  await settle();
  pending[0].resolve({docs:[{id:'2026-10-20', data:()=>({status:'full_booked'})}]});
  await settle();
  assert.equal(ctx.availabilityMap['2026-11-12'], 'full_booked', 'respons bulan lama tidak menghapus status bulan terbaru');
  console.log('LULUS', page, 'rentang bulan, pergantian bulan, respons tidak berurutan');
}
Promise.all(['index.html','booking/index.html'].map(check)).catch(e => {console.error(e); process.exitCode = 1;});
