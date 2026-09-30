#!/usr/bin/env node
// Penambahan produk: masukkan affiliate URL ke affiliate-links.json lalu jalankan
// `node acfinder/sync-products.mjs`. Hanya metadata yang DAPAT diverifikasi
// secara langsung yang disimpan. Shopee bisa membatasi crawler; URL tidak pernah
// diubah saat ditampilkan/dibuka pelanggan.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {categorizeBudget,validateProduct} from './engine.mjs';import {validateInventory} from './inventory.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const linksPath=path.join(dir,'affiliate-links.json'),outPath=path.join(dir,'products.json');
const links=JSON.parse(fs.readFileSync(linksPath,'utf8'));
const existing=fs.existsSync(outPath)?JSON.parse(fs.readFileSync(outPath,'utf8')):[];
if(!Array.isArray(links))throw Error('affiliate-links.json harus array');
const byUrl=new Map(existing.filter(p=>!p.variant_of).map(p=>[p.affiliate_url,p]));
const variants=existing.filter(p=>p.variant_of);
const cleanText=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
const meta=(s,name)=>{const re=new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,'i');const m=s.match(re);return m?cleanText(m[1]||m[2]):null};
const extract=(html)=>{const title=meta(html,'og:title')||meta(html,'twitter:title')||cleanText(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);const image=meta(html,'og:image')||meta(html,'twitter:image');const desc=meta(html,'og:description')||meta(html,'description');return {title:title||null,image:image||null,description:desc||null}};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const changes=[];
for(const [i,entry] of links.entries()){
 const u=entry.affiliate_url;if(!validateProduct({product_id:'check',affiliate_url:u,verification_status:'unverified'}).valid)throw Error(`URL ke-${i+1} bukan Shopee yang sah`);
 const previous=byUrl.get(u)||{};const id=previous.product_id||`shopee-${String(i+1).padStart(3,'0')}`;
 const rec={product_id:id,affiliate_url:u,brand:previous.brand??null,model:previous.model??null,product_name:previous.product_name??null,pk:previous.pk??null,inverter:previous.inverter??null,price:previous.price??null,budget_category:previous.price!=null?categorizeBudget(previous.price):null,specifications:previous.specifications??{},image:previous.image??null,rating:previous.rating??null,review_count:previous.review_count??null,verification_status:previous.verification_status??'unverified',last_checked:previous.last_checked??null,active:previous.active??true,source_url:previous.source_url??null,verification_notes:previous.verification_notes??null};
 if(process.argv.includes('--check-links')){
   try{
     // curl mengikuti proxy HTTPS pada sandbox; fetch Node bisa gagal sebelum redirect.
     const raw=execFileSync('curl',['-Ls','--max-time','18','-A','Mozilla/5.0 (compatible; AslanTeknikInventory/1.0)','-w','\n__ACFINDER_FINAL__%{http_code} %{url_effective}',u],{encoding:'utf8',maxBuffer:2_000_000,timeout:21000});
     const marker=raw.lastIndexOf('\n__ACFINDER_FINAL__');if(marker<0)throw Error('hasil redirect tidak tersedia');
     const [status,urlText]=raw.slice(marker+19).trim().split(/\s+/,2);
     const url=new URL(urlText);if(!['shopee.co.id','www.shopee.co.id','s.shopee.co.id'].includes(url.hostname))throw Error(`redirect ke domain tak dikenal: ${url.hostname}`);
     const found=extract(raw.slice(0,marker));rec.source_url=url.origin+url.pathname;rec.last_checked=new Date().toISOString();
     if(status==='200'&&found.title&&!/shopee indonesia|captcha|login/i.test(found.title)){rec.product_name=found.title;rec.image=found.image||rec.image;rec.specifications={...rec.specifications,description:found.description};rec.verification_notes='Judul/foto ditemukan; PK, tipe inverter, dan harga masih memerlukan verifikasi eksplisit.';}
     else rec.verification_notes=`HTTP ${status}; detail produk tidak tersedia dari respons publik. Nilai PK/tipe/harga tidak ditebak.`;
     changes.push(`${id}: HTTP ${status}, ${rec.product_name?'judul terbaca':'metadata tidak tersedia'}`);
   }catch(error){rec.last_checked=new Date().toISOString();rec.verification_notes=`Gagal membaca metadata: ${String(error.message).slice(0,120)}`;changes.push(`${id}: ${rec.verification_notes}`)}
   await sleep(300);
 }
 // Verified HANYA jika data inti lengkap dan diverifikasi manual/sumber terpercaya.
 if(!rec.product_name||!rec.brand||!Number.isFinite(Number(rec.pk))||rec.pk<=0||!Number.isFinite(Number(rec.price))||rec.price<=0)rec.verification_status='unverified';
 else if(typeof rec.inverter!=='boolean'||!rec.model)rec.verification_status='partial';
 byUrl.set(u,rec);
}
const validURLs=new Set(links.map(e=>e.affiliate_url));const products=[...byUrl.values(),...variants].filter(p=>validURLs.has(p.affiliate_url));const errors=validateInventory(products);if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(outPath,JSON.stringify(products,null,2)+'\n');console.log(`Tersimpan ${products.length} produk; terverifikasi ${products.filter(p=>p.verification_status==='verified').length}; tidak terverifikasi ${products.filter(p=>p.verification_status!=='verified').length}`);for(const line of changes)console.log(line);
