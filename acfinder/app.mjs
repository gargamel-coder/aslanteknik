import {analyzeNeeds,recommendProducts,findPartialProducts,findAlternatives,pkLabel,RECOMMENDED_BRANDS} from './engine.mjs';
import {loadInventory} from './inventory.mjs';
const questions=[
 {key:'room',title:'AC ini untuk ruangan apa?',hint:'Pilih yang paling menggambarkan ruanganmu.',options:[['Kamar tidur','Kamar tidur'],['Ruang tamu','Ruang tamu'],['Ruang keluarga','Ruang keluarga'],['Ruang kerja','Ruang kerja'],['Kantor','Kantor'],['Toko/usaha','Toko / usaha'],['Lainnya','Lainnya']]},
 {key:'size',title:'Berapa ukuran ruangannya?',hint:'Cukup perkiraan panjang dan lebar ruangan dalam meter.',dimensions:true},
 {key:'ceiling',title:'Seberapa tinggi plafonnya?',hint:'Kalau tidak yakin, pilih tinggi plafon biasa.',options:[['low','Di bawah 2,5 meter'],['normal','2,5–3 meter'],['high','Di atas 3 meter']]},
 {key:'people',title:'Biasanya ada berapa orang?',hint:'Hitung orang yang sering berada di ruangan saat AC menyala.',options:[['1','1 orang'],['2','2 orang'],['3-4','3–4 orang'],['5+','5 orang atau lebih']]},
 {key:'sun',title:'Seberapa panas ruangan kamu?',hint:'Perhatikan paparan matahari, terutama siang dan sore.',options:[['none','Tidak terkena matahari langsung'],['little','Sedikit terkena matahari'],['moderate','Cukup terkena matahari'],['very','Sangat panas, terutama siang/sore']]},
 {key:'heat',title:'Banyak perangkat yang menghasilkan panas?',hint:'Misalnya TV, komputer, mesin, atau beberapa perangkat sekaligus.',options:[['none','Tidak ada'],['tv','TV / komputer'],['several','Beberapa perangkat elektronik'],['many','Banyak perangkat yang menghasilkan panas']]},
 {key:'hours',title:'AC akan menyala berapa lama per hari?',hint:'Tidak harus tepat, pilih yang paling mendekati kebiasaanmu.',options:[['<4','Kurang dari 4 jam'],['4-8','4–8 jam'],['8-12','8–12 jam'],['>12','Lebih dari 12 jam']]},
 {key:'priority',title:'Apa yang paling penting buat kamu?',hint:'Tidak ada jawaban benar atau salah.',options:[['harga','Harga lebih terjangkau'],['hemat','Hemat listrik'],['dingin','Cepat dingin'],['senyap','Lebih senyap'],['seimbang','Seimbang antara harga dan performa']]},
 {key:'inverter',title:'Mau AC inverter?',hint:'Kalau ragu, biarkan kami memilih berdasarkan kebutuhanmu.',options:[['yes','Ya, saya mau inverter'],['no','Tidak, saya pilih non-inverter'],['auto','Saya tidak tahu, pilihkan yang sesuai']]},
 {key:'budget',title:'Berapa budget untuk unit AC?',hint:'Budget khusus unit AC; biaya pemasangan bisa berbeda.',options:[['under3','Di bawah Rp3 juta'],['3-5','Rp3–5 juta'],['5-8','Rp5–8 juta'],['8-12','Rp8–12 juta'],['over12','Di atas Rp12 juta']]}
];
const state={step:0,answers:{},busy:false,advancing:false};const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const btu=n=>`${Math.round(n).toLocaleString('id-ID')} BTU/jam`;
const signed=n=>`${n>=0?'+':'−'}${Math.round(Math.abs(n)).toLocaleString('id-ID')} BTU/jam`;
function render(){const q=questions[state.step];$('step-counter').textContent=`Pertanyaan ${state.step+1} dari ${questions.length}`;const pct=Math.round((state.step+1)/questions.length*100);$('progress-label').textContent=`${pct}%`;$('progress-fill').style.width=`${pct}%`;$('error').textContent='';$('back').disabled=state.step===0;$('next').disabled=state.busy;$('next').hidden=!q.dimensions;$('next').textContent=state.step===questions.length-1?'Lihat hasil ❄️':'Lanjut →';
 $('question').innerHTML=`<h2>${safe(q.title)}</h2><p class="hint">${safe(q.hint)}</p>`+(q.dimensions?`<div class="dimensions"><label>Panjang (meter)<input id="length" inputmode="decimal" type="number" min="1" max="30" step="0.1" placeholder="Contoh: 3" value="${safe(state.answers.length||'')}"></label><label>Lebar (meter)<input id="width" inputmode="decimal" type="number" min="1" max="30" step="0.1" placeholder="Contoh: 4" value="${safe(state.answers.width||'')}"></label></div><div class="measure" id="measure">Luas ruangan akan dihitung otomatis.</div>`:`<div class="options" role="group" aria-label="${safe(q.title)}">${q.options.map(([value,label])=>`<button type="button" class="option" data-value="${safe(value)}" aria-pressed="${state.answers[q.key]===value}">${safe(label)}</button>`).join('')}</div>`);
 // Ukuran ruangan tidak lagi pindah otomatis saat mengetik (bisa terpotong, mis. "1" sebelum "15"); pengguna menekan Lanjut atau Enter.
 if(q.dimensions){for(const id of ['length','width']){$(id).addEventListener('input',()=>{state.answers[id]=$(id).value;const a=Number(state.answers.length)*Number(state.answers.width);$('measure').textContent=a>0&&Number.isFinite(a)?`Perkiraan luas: ${Number(a.toFixed(1))} m²`:'Luas ruangan akan dihitung otomatis.'});$(id).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();advance()}})}if(state.answers.length&&state.answers.width)$('length').dispatchEvent(new Event('input'))}
 else $('question').querySelectorAll('.option').forEach(btn=>btn.addEventListener('click',()=>{if(state.advancing)return;state.answers[q.key]=btn.dataset.value;$('question').querySelectorAll('.option').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));$('error').textContent='';state.advancing=true;setTimeout(()=>{state.advancing=false;advance()},180)}));
}
function advance(){const err=validate();if(err){$('error').textContent=err;return}if(state.step===questions.length-1)showResult();else{state.step++;render();document.querySelector('#wizard h2')?.focus?.()}}
function valueLabel(key,value){return questions.find(q=>q.key===key)?.options?.find(([v])=>v===value)?.[1]||value}
function validate(){const q=questions[state.step];if(q.dimensions){const a=Number(state.answers.length),b=Number(state.answers.width);if(!Number.isFinite(a)||!Number.isFinite(b)||a<1||b<1||a>30||b>30||a*b>250)return 'Isi panjang dan lebar antara 1–30 meter, dengan luas maksimal 250 m².'}else if(!state.answers[q.key])return 'Pilih satu jawaban untuk melanjutkan.';return ''}

// Satu baris penjelasan per pertanyaan: apa jawabannya, apa artinya, dan pengaruhnya ke rekomendasi.
function answerExplanations(need){
 const a=state.answers,b=need.breakdown,pct=x=>`${Math.round(Math.abs(x-1)*100)}%`;
 const roomMeaning={'Kamar tidur':'AC dipakai saat tidur, jadi suara yang halus dan mode tidur (sleep) akan terasa manfaatnya.','Ruang tamu':'Pintu dan jendela lebih sering dibuka, jadi udara dingin lebih mudah keluar.','Ruang keluarga':'Biasanya dipakai bersama dan cukup lama, jadi kenyamanan merata lebih penting.','Ruang kerja':'Komputer dan pemakaian di jam kerja membuat ruangan cepat hangat.','Kantor':'Pemakaian di jam kerja cukup panjang dan orang sering keluar-masuk.','Toko/usaha':'Pintu sering dibuka untuk pelanggan, jadi AC bekerja lebih keras.','Lainnya':'Kami menghitung dari ukuran dan kondisi ruangan yang kamu isi.'};
 const sunMeaning={none:'Dinding dan kaca tidak terkena sinar matahari langsung, jadi tidak ada tambahan panas dari luar.',little:'Ada sedikit panas dari sinar matahari yang masuk.',moderate:'Panas matahari cukup terasa, terutama siang hingga sore.',very:'Ruangan menerima panas matahari yang besar, misalnya menghadap barat atau berkaca lebar.'};
 const heatMeaning={none:'Tidak ada perangkat yang menambah panas ruangan.',tv:'TV atau komputer mengeluarkan panas saat menyala.',several:'Beberapa perangkat elektronik bersama-sama menambah panas ruangan.',many:'Banyak perangkat (mis. mesin, kulkas display, komputer) menambah panas cukup besar.'};
 const hoursMeaning={'<4':'Pemakaian singkat.','4-8':'Pemakaian sedang.','8-12':'Pemakaian lama, misalnya semalaman.','>12':'Pemakaian sangat lama, hampir sepanjang hari.'};
 const typeEffect={'manual-yes':'Kamu memilih inverter, jadi hanya AC inverter yang kami tampilkan.','manual-no':'Kamu memilih non-inverter, jadi hanya AC non-inverter yang kami tampilkan.','auto-long':`Karena AC menyala ${valueLabel('hours',a.hours).toLowerCase()} per hari, kami sarankan <strong>inverter</strong>: makin lama menyala, makin terasa hematnya.`,'auto-mid-eco':`Pemakaian 4–8 jam ditambah prioritas ${valueLabel('priority',a.priority).toLowerCase()} membuat <strong>inverter</strong> lebih sesuai.`,'auto-short':`Untuk pemakaian ${valueLabel('hours',a.hours).toLowerCase()} per hari, <strong>non-inverter</strong> lebih masuk akal: harganya lebih murah dan selisih tagihan listriknya kecil.`};
 const priorityEffect={harga:'AC dengan harga lebih rendah kami urutkan lebih atas.',hemat:'Kami condong ke inverter bila pemakaianmu cukup lama.',dingin:'Kapasitas tidak kami turunkan di bawah hitungan, supaya ruangan tetap cepat dingin.',senyap:'Kami condong ke inverter bila pemakaianmu cukup lama, karena kompresornya bekerja lebih halus.',seimbang:'Kami mengutamakan AC dengan kapasitas paling pas untuk ruanganmu.'};
 const ceilEffect=a.ceiling==='normal'?'Tidak ada penyesuaian.':`${a.ceiling==='high'?'Volume udara lebih besar, kebutuhan naik':'Volume udara lebih kecil, kebutuhan turun'} ${pct(a.ceiling==='high'?1.18:0.94)} (${signed(b.ceilingBtu)}).`;
 const sunMult={none:1,little:1.09,moderate:1.19,very:1.32}[a.sun];
 return [
  ['Ruangan',valueLabel('room',a.room),roomMeaning[a.room]||roomMeaning.Lainnya,'Tidak mengubah hitungan kapasitas, hanya konteks pemakaian.'],
  ['Ukuran',`${safe(a.length)} × ${safe(a.width)} m = ${Number(need.area.toFixed(1))} m²`,'Ruangan yang lebih luas butuh tenaga pendingin lebih besar.',`Kebutuhan dasar: ${Number(need.area.toFixed(1))} m² × 500 = <strong>${btu(b.baseBtu)}</strong>.`],
  ['Tinggi plafon',valueLabel('ceiling',a.ceiling),a.ceiling==='high'?'Plafon tinggi berarti udara yang harus didinginkan lebih banyak.':a.ceiling==='low'?'Plafon rendah berarti udara yang harus didinginkan lebih sedikit.':'Tinggi plafon standar rumah.',ceilEffect],
  ['Jumlah orang',valueLabel('people',a.people),'Setiap orang mengeluarkan panas tubuh.',b.peopleBtu?`Tambahan ${signed(b.peopleBtu)}.`:'Satu orang sudah termasuk dalam kebutuhan dasar.'],
  ['Paparan matahari',valueLabel('sun',a.sun),sunMeaning[a.sun],sunMult===1?'Tidak ada tambahan.':`Kebutuhan naik ${pct(sunMult)} (${signed(b.sunBtu)}).`],
  ['Perangkat panas',valueLabel('heat',a.heat),heatMeaning[a.heat],b.heatBtu?`Tambahan ${signed(b.heatBtu)}.`:'Tidak ada tambahan.'],
  ['Lama pemakaian',`${valueLabel('hours',a.hours)} per hari`,hoursMeaning[a.hours],need.manualType?'Dipakai sebagai catatan; tipe AC mengikuti pilihanmu.':'Menentukan tipe AC yang kami sarankan (lihat di bawah).'],
  ['Prioritas',valueLabel('priority',a.priority),'Hal yang paling kamu pentingkan saat memilih.',priorityEffect[a.priority]||priorityEffect.seimbang],
  ['Tipe AC',valueLabel('inverter',a.inverter),'Inverter mengatur putaran kompresor sehingga lebih hemat untuk pemakaian lama; non-inverter lebih murah di awal.',typeEffect[need.typeReason]],
  ['Budget',need.budget.label,'Batas harga unit AC (belum termasuk pemasangan).',need.budget.max===Infinity?'Semua harga ditampilkan; yang paling pas kebutuhan diutamakan.':`Hanya AC dengan harga maksimal ${rupiah(need.budget.max)} yang kami tampilkan.`]
 ];
}
function needSummary(need){
 const pkText=pkLabel(need.pk);
 return `Total kebutuhan pendinginan ruanganmu sekitar <strong>${btu(need.requiredBtu)}</strong>. Kapasitas AC terdekat yang mencukupi adalah <strong>${pkText} PK</strong> (±${btu(need.pkBtu)}), tipe <strong>${need.inverter?'inverter':'non-inverter'}</strong>, dengan budget ${safe(need.budget.label)}.`;
}
function whyThisProduct(p,need){
 const reasons=[];
 reasons.push(Number(p.pk)===need.pk?`Kapasitas ${pkLabel(Number(p.pk))} PK pas dengan kebutuhan ruanganmu.`:`Kapasitas ${pkLabel(Number(p.pk))} PK sedikit di atas kebutuhan (${pkLabel(need.pk)} PK), jadi ruangan lebih cepat dingin.`);
 reasons.push(`${p.inverter?'Inverter':'Non-inverter'}, sesuai tipe yang disarankan.`);
 if(need.budget.max!==Infinity)reasons.push(`Harga ${rupiah(p.price)} masih di bawah batas budget ${rupiah(need.budget.max)}.`);
 if(/berdiri|floor/i.test(p.product_name||''))reasons.push('Model berdiri (floor standing), cocok untuk ruangan besar; butuh ruang lantai.');
 return reasons;
}
function checkedDate(p){const d=p.last_checked?new Date(p.last_checked):null;return d&&!isNaN(d)?d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):null}
function renderProduct(item,need,extraNote=''){const p=item.product;const photo=p.image&&/^https:\/\//.test(p.image)?`<img src="${safe(p.image)}" alt="Foto ${safe(p.product_name)}" loading="lazy" referrerpolicy="no-referrer">`:'';const date=checkedDate(p);
 return `<article class="product">${photo}<div><span class="badge">${safe(item.label)}</span><h3>${safe(p.brand)} ${safe(p.model)}</h3><p>${safe(p.product_name)}</p><div class="price">${safe(rupiah(p.price))} <small>(harga acuan${date?` per ${safe(date)}`:''})</small></div>${extraNote?`<p class="alt-note">${extraNote}</p>`:`<ul class="why">${whyThisProduct(p,need).map(r=>`<li>${safe(r)}</li>`).join('')}</ul>`}<p>Pilih varian <strong>${safe(p.model)}</strong> dan cek harga terkini di Shopee sebelum membeli.</p>${typeof p.rating==='number'?`<p>⭐ ${safe(p.rating)}${p.review_count!=null?` · ${safe(p.review_count)} ulasan`:''}</p>`:''}<a class="shopee" href="${safe(p.affiliate_url)}" target="_blank" rel="noopener noreferrer sponsored nofollow">🛒 Lihat di Shopee</a></div></article>`}
function renderPartial(p){return `<article class="product"><div><span class="badge">Perlu cek jenis AC</span><h3>${safe(p.brand)} ${safe(p.model||p.product_name)}</h3><p>${safe(p.pk)} PK · Jenis inverter belum diketahui · ${safe(rupiah(p.price))} (harga acuan)</p><p>Ukuran dan budget tampak sesuai, tetapi tipe inverter/non-inverter belum dapat dipastikan. Pilih varian <strong>${safe(p.model||p.product_name)}</strong> dan periksa jenis serta harga terkini sebelum membeli.</p><a class="shopee" href="${safe(p.affiliate_url)}" target="_blank" rel="noopener noreferrer sponsored nofollow">🛒 Periksa di Shopee</a></div></article>`}
function renderAlternatives(alts,need){if(!alts.length)return '';
 const note=(x)=>x.reason==='type'?`<strong>Beda tipe:</strong> ini AC ${x.product.inverter?'inverter':'non-inverter'}, bukan ${need.inverter?'inverter':'non-inverter'} seperti saran kami, tetapi kapasitas dan harganya sesuai.`:`<strong>Di atas budget:</strong> kapasitas dan tipenya pas, tetapi harganya ${rupiah(x.product.price)}, melebihi batas ${rupiah(need.budget.max)}.`;
 return `<section class="products"><h2>Alternatif terdekat</h2><p class="hint">Tidak ada yang pas sepenuhnya, jadi ini pilihan paling dekat. Perbedaannya kami tulis jelas supaya kamu bisa memutuskan sendiri.</p>${alts.map(x=>renderProduct({label:x.reason==='type'?'🔄 Beda tipe':'💸 Di atas budget',product:x.product},need,note(x))).join('')}</section>`}

async function showResult(){if(state.busy)return;state.busy=true;$('next').disabled=true;$('error').textContent='';let need;try{need=analyzeNeeds(state.answers)}catch(e){$('error').textContent=e.message;state.busy=false;$('next').disabled=false;return}
 $('wizard').hidden=true;$('result').hidden=false;$('result').innerHTML='<div class="panel loading" role="status">Sedang memahami kebutuhan ruanganmu dan memeriksa katalog produk…</div>';await new Promise(resolve=>setTimeout(resolve,350));
 let rows=[],error=null;try{rows=await loadInventory()}catch(e){error=e.message}
 const matches=error?[]:recommendProducts(need,rows),partial=error?[]:findPartialProducts(need,rows),alts=error||matches.length?[]:findAlternatives(need,rows);
 const explanations=answerExplanations(need);
 const emptyMsg=error?'Katalog belum dapat dimuat. Coba lagi nanti.':`Katalog kami belum punya AC ${pkLabel(need.pk)} PK ${need.inverter?'inverter':'non-inverter'} dengan harga ${need.budget.max===Infinity?'yang tersedia':`di bawah ${rupiah(need.budget.max)}`}. Kami tidak akan menurunkan kapasitas karena ruangan jadi tidak cukup dingin.`;
 $('result').innerHTML=`<div class="result-intro"><div class="eyebrow">Hasil konsultasi kamu</div><h2>❄️ ${safe(pkLabel(need.pk))} PK ${need.inverter?'Inverter':'Non-inverter'}</h2><p>Perkiraan kapasitas sekitar ${btu(need.requiredBtu)}. Di bawah ini penjelasan bagaimana setiap jawabanmu memengaruhi hasil, lalu rekomendasi AC yang cocok.</p></div>
 <div class="panel">
  <h3>Penjelasan dari setiap jawabanmu</h3>
  <ol class="explain">${explanations.map(([q,ans,meaning,effect])=>`<li><div class="explain-head"><small>${safe(q)}</small><strong>${ans}</strong></div><p>${safe(meaning)}</p><p class="effect">→ ${effect}</p></li>`).join('')}</ol>
  <div class="conclusion"><h3>Jadi, kebutuhanmu:</h3><p>${needSummary(need)}</p></div>
  ${need.overRange?'<p class="disclaimer">Ukuran dan beban panas melebihi kapasitas satu unit AC yang umum. Pertimbangkan dua unit atau konsultasikan dengan teknisi sebelum membeli.</p>':''}
  <p class="disclaimer">Kapasitas ini perkiraan awal, bukan pengganti survei ruangan. Performa dan konsumsi listrik dipengaruhi kondisi bangunan, instalasi, dan cara pemakaian.</p>
  <div class="brand-note"><h3>🔧 Kenapa hanya merek ini?</h3><p>Rekomendasi kami hanya mencakup <strong>${RECOMMENDED_BRANDS.join(', ')}</strong>. Daftar ini disusun dari pengamatan langsung teknisi Aslan Teknik saat memasang, merawat, dan memperbaiki AC pelanggan di lapangan: merek yang unitnya jarang bermasalah, mudah diservis, dan suku cadangnya mudah dicari.</p></div>
  <section class="products"><h2>Rekomendasi AC untukmu</h2>${matches.length?matches.map(x=>renderProduct(x,need)).join(''):`<div class="empty"><strong>Belum ada AC yang pas dengan semua kebutuhan ini.</strong><p>${safe(emptyMsg)}</p></div>`}</section>
  ${renderAlternatives(alts,need)}
  ${partial.length?`<section class="products"><h2>Opsi yang perlu kamu periksa</h2><p class="hint">Tipe inverter produk di bawah belum diketahui. Ini bukan rekomendasi kecocokan penuh.</p>${partial.map(renderPartial).join('')}</section>`:''}
  <p class="disclosure">Beberapa tautan produk di halaman ini merupakan tautan afiliasi. Kami dapat menerima komisi jika kamu membeli melaluinya, tanpa biaya tambahan untuk kamu.</p>
  <div class="bottom-cta"><h3>Masih ragu memilih?</h3><p>Kamu bisa meminta saran teknisi Aslan Teknik atau booking pemasangan.</p><a href="/booking">Booking layanan AC →</a></div>
  <div class="controls"><button type="button" class="btn btn-back" id="restart">Mulai ulang</button></div>
 </div>`;
 $('restart').addEventListener('click',()=>{state.step=0;state.answers={};state.busy=false;state.advancing=false;$('result').hidden=true;$('wizard').hidden=false;render();window.scrollTo({top:0,behavior:'smooth'})});state.busy=false;window.scrollTo({top:0,behavior:'smooth'});
}
$('back').addEventListener('click',()=>{if(state.step>0){state.step--;render()}});$('next').addEventListener('click',advance);render();
