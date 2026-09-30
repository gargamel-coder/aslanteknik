import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeNeeds, categorizeBudget, recommendProducts, validateProduct } from './engine.mjs';
const base={room:'Kamar tidur',length:3,width:4,ceiling:'normal',people:'2',sun:'moderate',heat:'none',hours:'8-12',priority:'hemat',inverter:'auto',budget:'3-5'};
test('kondisi panas mengubah kebutuhan kapasitas, bukan luas saja',()=>{
 const a=analyzeNeeds(base),b=analyzeNeeds({...base,sun:'very',people:'5+',ceiling:'high',heat:'many'});
 assert.ok(b.requiredBtu>a.requiredBtu); assert.ok(b.pk>a.pk);
});
test('pilihan tipe eksplisit ditaati dan auto memakai kebiasaan',()=>{
 assert.equal(analyzeNeeds({...base,inverter:'yes'}).inverter,true);
 assert.equal(analyzeNeeds({...base,inverter:'no'}).inverter,false);
 assert.equal(analyzeNeeds(base).inverter,true);
 assert.equal(analyzeNeeds({...base,hours:'<4',priority:'harga',budget:'under3'}).inverter,false);
});
test('dimensi invalid tidak menghasilkan rekomendasi',()=>{
 assert.throws(()=>analyzeNeeds({...base,length:0}),/ukuran/i);
 assert.throws(()=>analyzeNeeds({...base,width:200}),/ukuran/i);
});
test('produk tak terverifikasi tidak diranking; tipe, kapasitas, budget disaring',()=>{
 const need=analyzeNeeds(base);
 const mk=(id,pk,inverter,price)=>({product_id:id,affiliate_url:'https://s.shopee.co.id/4VdBmtalVr',brand:'Brand',model:id,product_name:id,pk,inverter,price,verification_notes:'Verifikasi manual dari halaman produk',verification_status:'verified',active:true});
 const products=[mk('cocok',need.pk,true,4500000),mk('mahal',need.pk,true,15000000),mk('kapasitas-kecil',0.5,true,2500000),mk('tipe-salah',need.pk,false,4000000),{...mk('palsu',need.pk,true,3500000),verification_status:'unverified'}];
 const result=recommendProducts(need,products);
 assert.deepEqual(result.map(x=>x.product.product_id),['cocok']);
});
test('slot hemat/efisien tidak mengulang dan hanya produk benar-benar cocok',()=>{
 const need=analyzeNeeds(base);
 const mk=(id,price,rating=null)=>({product_id:id,affiliate_url:'https://s.shopee.co.id/4VdBmtalVr',brand:'A',model:id,product_name:id,pk:need.pk,inverter:true,price,rating,verification_notes:'Verifikasi manual dari halaman produk',verification_status:'verified',active:true});
 const result=recommendProducts(need,[mk('a',4600000,4.8),mk('b',3500000,4.5),mk('c',4900000,4.7),mk('d',5100000,4.9)]);
 assert.ok(result.length<=3);assert.equal(new Set(result.map(x=>x.product.product_id)).size,result.length);
 assert.ok(result.every(x=>x.product.price<=5000000));
});
test('validasi menolak URL non-Shopee dan kategori budget konsisten',()=>{
 assert.equal(validateProduct({affiliate_url:'https://evil.example/?s.shopee.co.id/x',pk:1,inverter:true,price:4000000}).valid,false);
 assert.equal(categorizeBudget(4500000),'3-5');
});
test('inventory kosong menghasilkan jawaban jujur',()=>assert.deepEqual(recommendProducts(analyzeNeeds(base),[]),[]));

await import('./inventory.mjs').then(({validateInventory})=>{
 test('inventory menolak ID/URL duplikat dan tak mengarang metadata',()=>{
  const rows=[{product_id:'x',affiliate_url:'https://s.shopee.co.id/4VdBmtalVr',brand:null,pk:null,inverter:null,price:null,verification_status:'unverified',active:true}];
  assert.equal(validateInventory(rows).length,0);
  assert.ok(validateInventory([...rows,...rows]).length>0);
 });
});
