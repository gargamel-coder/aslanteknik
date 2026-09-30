import test from 'node:test';
import assert from 'node:assert/strict';
import {validateInventory} from './inventory.mjs';
import {analyzeNeeds,recommendProducts,findPartialProducts} from './engine.mjs';
const url='https://s.shopee.co.id/4VdBmtalVr';
const make=(id,pk)=>({product_id:id,affiliate_url:url,brand:'AQUA',model:id,product_name:id,pk,inverter:null,price:2500000,verification_status:'unverified',active:true,verification_notes:'Data pengguna'});
test('dua varian berbeda dari satu tautan afiliasi boleh berada dalam katalog',()=>{
 assert.deepEqual(validateInventory([make('a-05',0.5),make('a-09',1)]),[]);
});
test('dua varian identik dari satu tautan afiliasi tetap ditolak',()=>{
 assert.ok(validateInventory([make('a-05',0.5),make('a-05-lagi',0.5)]).some(e=>e.includes('duplikat')));
});
test('rekomendasi tipe inverter yang eksplisit mempertahankan URL afiliasi asli',()=>{
 const need=analyzeNeeds({room:'Kamar tidur',length:2,width:2,ceiling:'normal',people:'1',sun:'none',heat:'none',hours:'8-12',priority:'hemat',inverter:'yes',budget:'3-5'});
 const product={product_id:'tcl-inv',affiliate_url:'https://s.shopee.co.id/6L4pyP13g2',brand:'TCL',model:'TAC-05CSV/ZB2',product_name:'TCL SavelN AI WiFi Inverter',pk:0.5,inverter:true,price:3500000,budget_category:'3-5',verification_status:'verified',verification_notes:'Spesifikasi dan harga diberikan pemilik',active:true};
 assert.equal(recommendProducts(need,[product])[0].product.affiliate_url,product.affiliate_url);
});
 test('produk dengan tipe belum diketahui muncul sebagai opsi cek manual, bukan ranking',()=>{
 const need=analyzeNeeds({room:'Kamar tidur',length:2,width:2,ceiling:'normal',people:'1',sun:'none',heat:'none',hours:'8-12',priority:'hemat',inverter:'yes',budget:'under3'});
 const p={...make('a-05',0.5),verification_status:'partial'};assert.equal(findPartialProducts(need,[p])[0].product_id,p.product_id);
 assert.deepEqual(recommendProducts(need,[p]),[]);
});
test('produk dengan jenis inverter belum diketahui tetap tidak diklaim cocok',()=>{
 const need=analyzeNeeds({room:'Kamar tidur',length:2,width:2,ceiling:'normal',people:'1',sun:'none',heat:'none',hours:'8-12',priority:'hemat',inverter:'yes',budget:'under3'});
 assert.deepEqual(recommendProducts(need,[make('a-05',0.5)]),[]);
});
