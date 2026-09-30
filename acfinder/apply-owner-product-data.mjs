#!/usr/bin/env node
// Penerapan data yang diberikan pemilik. Tidak menganggap metadata situs Shopee
// terverifikasi; setiap atribut diberi catatan asal yang eksplisit.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateInventory} from './inventory.mjs';
import {categorizeBudget} from './engine.mjs';
const file=path.join(path.dirname(fileURLToPath(import.meta.url)),'products.json');
const rows=JSON.parse(fs.readFileSync(file,'utf8'));
const get=id=>{const p=rows.find(r=>r.product_id===id);if(!p)throw Error(`ID tidak ditemukan: ${id}`);return p};
const note='Data harga dan spesifikasi diberikan langsung oleh pemilik Aslan Teknik pada 30 September 2026; detail tidak bisa diverifikasi mandiri dari halaman Shopee publik. Konfirmasi harga dan varian di Shopee sebelum checkout.';
function set(id,details){const p=get(id);Object.assign(p,details);p.budget_category=p.price==null?null:categorizeBudget(p.price);p.verification_notes=note;p.last_checked=new Date().toISOString();}
set('shopee-001',{
 brand:'AQUA',model:'AQA-KR05FQDL/FQAL',product_name:'AQUA AQA-KR05FQDL/FQAL — varian ½ PK',pk:0.5,inverter:null,price:2500000,
 specifications:{cooling_btu_h:5000,power_watt:360,room_area_m2_up_to:10,features:['Pendinginan cepat (klaim penjual: sekitar 5 menit)','Operasi 160–242 V','Aliran udara lebih jauh','Label efisiensi energi 4 bintang (klaim deskripsi)']},verification_status:'partial'});
const small=get('shopee-001');rows.push({...small,product_id:'shopee-001-1pk',variant_of:'shopee-001',model:'AQA-KR09FQDL/FQAL',product_name:'AQUA AQA-KR09FQDL/FQAL — varian 1 PK',pk:1,price:3300000,budget_category:'3-5',specifications:{cooling_btu_h:9000,power_watt:760,room_area_m2_up_to:14},last_checked:new Date().toISOString()});
set('shopee-003',{
 brand:'TCL',model:null,product_name:'TCL AC ½ PK — model belum disebut',pk:0.5,inverter:null,price:2800000,
 specifications:{features:['Smart Air Flow','Comfortable Fast Cooling','Titan Gold','Super Quiet 22 dB (klaim deskripsi)','R32','I-Set','Turbo Mode']},verification_status:'partial'});
set('shopee-004',{
 brand:'TCL',model:'TAC-05CSV/ZB2',product_name:'TCL SavelN AI WiFi Inverter ½ PK TAC-05CSV/ZB2',pk:0.5,inverter:true,price:3500000,
 specifications:{power_watt:385,features:['Kontrol WiFi TCL Home','Smart Airflow','Auto Diagnose','Silent Mode 26 dB (klaim deskripsi)','Fast Cooling (klaim deskripsi)','Outdoor self-cleaning'],warranty_compressor_years:10,warranty_sparepart_years:5,energy_efficiency_verified:false},verification_status:'verified'});
const errors=validateInventory(rows);if(errors.length)throw Error(errors.join('\n'));
fs.writeFileSync(file,JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify(rows.filter(r=>['shopee-001','shopee-001-1pk','shopee-003','shopee-004'].includes(r.product_id)).map(({product_id,affiliate_url,pk,inverter,price,verification_status})=>({product_id,affiliate_url,pk,inverter,price,verification_status})),null,2));
const a=rows.filter(r=>r.verification_status==='verified');console.log(`total=${rows.length} layak_rekomendasi=${a.length}`);
