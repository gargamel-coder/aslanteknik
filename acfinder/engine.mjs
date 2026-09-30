// Mesin rekomendasi murni; tidak bergantung pada merek atau produk tertentu.
export const PK_LEVELS=[{pk:0.5,btu:5000},{pk:0.75,btu:7000},{pk:1,btu:9000},{pk:1.5,btu:12000},{pk:2,btu:18000},{pk:2.5,btu:24000},{pk:3,btu:28000}];
export const BUDGETS={'under3':{label:'Di bawah Rp3 juta',max:3000000},'3-5':{label:'Rp3–5 juta',max:5000000},'5-8':{label:'Rp5–8 juta',max:8000000},'8-12':{label:'Rp8–12 juta',max:12000000},'over12':{label:'Di atas Rp12 juta',max:Infinity,min:12000000}};
const factors={ceiling:{low:0.94,normal:1,high:1.18},people:{'1':0,'2':450,'3-4':1150,'5+':2400},sun:{none:1,little:1.09,moderate:1.19,very:1.32},heat:{none:0,tv:400,several:900,many:1600}};
export function categorizeBudget(price){if(!Number.isFinite(Number(price))||price<0)return null;return price<3000000?'under3':price<=5000000?'3-5':price<=8000000?'5-8':price<=12000000?'8-12':'over12'}
export function analyzeNeeds(a){
 const length=Number(a?.length),width=Number(a?.width);
 if(!Number.isFinite(length)||!Number.isFinite(width)||length<1||width<1||length>30||width>30||length*width>250)throw Error('Ukuran ruangan tidak valid. Isi panjang dan lebar antara 1–30 meter.');
 for(const [key,map] of Object.entries(factors))if(!(a[key] in map))throw Error(`Pilihan ${key} belum lengkap.`);
 if(!(a.budget in BUDGETS)||!['<4','4-8','8-12','>12'].includes(a.hours)||!['yes','no','auto'].includes(a.inverter))throw Error('Lengkapi pilihan pemakaian, tipe, dan budget.');
 const area=length*width;
 // Perkiraan awal dengan penyesuaian volume, hunian, paparan matahari, dan perangkat.
 const requiredBtu=Math.ceil(((area*500)*factors.ceiling[a.ceiling]+factors.people[a.people]+factors.heat[a.heat])*factors.sun[a.sun]);
 const level=PK_LEVELS.find(x=>x.btu>=requiredBtu)||PK_LEVELS.at(-1);
 const priority=a.priority||'seimbang';
 const auto=a.hours==='8-12'||a.hours==='>12'||(a.hours==='4-8'&&['hemat','senyap'].includes(priority));
 const inverter=a.inverter==='yes'?true:a.inverter==='no'?false:auto;
 const overRange=requiredBtu>PK_LEVELS.at(-1).btu;
 const budget=BUDGETS[a.budget];
 return {pk:level.pk,requiredBtu,area,length,width,ceiling:a.ceiling,people:a.people,sun:a.sun,heat:a.heat,hours:a.hours,priority,inverter,budgetKey:a.budget,budget,overRange,room:a.room||'ruangan',manualType:a.inverter!=='auto'};
}
export function validateProduct(p){
 const errors=[];let url;
 try{url=new URL(p?.affiliate_url||'')}catch{errors.push('URL tidak valid')}
 if(url&&!(url.protocol==='https:'&&['s.shopee.co.id','shopee.co.id','www.shopee.co.id'].includes(url.hostname)))errors.push('URL bukan Shopee resmi');
 if(!p?.product_id)errors.push('product_id kosong');
 if(p?.verification_status==='verified'&&(!Number.isFinite(Number(p.pk))||Number(p.pk)<=0||typeof p.inverter!=='boolean'||!Number.isFinite(Number(p.price))||Number(p.price)<=0||!p.product_name||!p.brand||!p.model||!String(p.verification_notes||'').trim()))errors.push('metadata inti atau bukti verifikasi belum lengkap');
 return {valid:errors.length===0,errors};
}
export function recommendProducts(need,inventory){
 const min=need.budget.min||0,max=need.budget.max;
 const candidates=inventory.filter(p=>p.active===true&&p.verification_status==='verified'&&validateProduct(p).valid&&Number(p.pk)>=need.pk&&Number(p.pk)<=need.pk+0.5&&p.inverter===need.inverter&&Number(p.price)>=min&&Number(p.price)<=max);
 candidates.sort((a,b)=>{const score=p=>(Number(p.pk)===need.pk?100:35)+(need.priority==='harga'?(max===Infinity?0:((max-p.price)/max)*30):0)+(typeof p.rating==='number'?p.rating*2:0)-(Number(p.pk)-need.pk)*30;return score(b)-score(a)||a.price-b.price});
 if(!candidates.length)return [];
 const result=[{label:'🎯 Paling sesuai',product:candidates[0]}],used=new Set([candidates[0].product_id]);
 const cheaper=candidates.filter(p=>!used.has(p.product_id)&&p.price<candidates[0].price).sort((a,b)=>a.price-b.price)[0];
 if(cheaper){result.push({label:'💰 Pilihan hemat',product:cheaper});used.add(cheaper.product_id)}
 if(need.inverter){const efficient=candidates.filter(p=>!used.has(p.product_id)&&p.specifications?.energy_efficiency_verified===true).sort((a,b)=>(b.specifications?.energy_efficiency_rating||0)-(a.specifications?.energy_efficiency_rating||0))[0];if(efficient){result.push({label:'⚡ Pilihan efisien',product:efficient});used.add(efficient.product_id)}}
 return result;
}
export function findPartialProducts(need,inventory){
 const min=need.budget.min||0,max=need.budget.max;
 return inventory.filter(p=>p.active===true&&p.verification_status==='partial'&&validateProduct(p).valid&&p.inverter==null&&Number(p.pk)>=need.pk&&Number(p.pk)<=need.pk+0.5&&Number(p.price)>=min&&Number(p.price)<=max).sort((a,b)=>Number(a.pk)-Number(b.pk)||Number(a.price)-Number(b.price)).slice(0,3);
}
export const pkLabel=pk=>Number.isInteger(pk)?String(pk):String(pk).replace('0.5','½').replace('0.75','¾').replace('1.5','1½').replace('2.5','2½');
