import {validateProduct,categorizeBudget} from './engine.mjs';
export function validateInventory(products){
 const errors=[];if(!Array.isArray(products))return ['inventory harus berupa array'];
 const ids=new Set(),variants=new Set();
 products.forEach((p,i)=>{const prefix=`produk #${i+1}`;const v=validateProduct(p);errors.push(...v.errors.map(e=>`${prefix}: ${e}`));if(ids.has(p.product_id))errors.push(`${prefix}: product_id duplikat`);else ids.add(p.product_id);const variant=`${p.affiliate_url}|${p.pk ?? 'unknown'}|${p.inverter ?? 'unknown'}`;if(variants.has(variant))errors.push(`${prefix}: varian produk duplikat`);else variants.add(variant);if(p.verification_status==='verified'&&p.budget_category!==categorizeBudget(p.price))errors.push(`${prefix}: budget_category tidak sesuai harga`);});return errors;
}
export async function loadInventory(path='/acfinder/products.json',fetcher=fetch){const response=await fetcher(path,{cache:'no-store'});if(!response.ok)throw Error(`Inventory gagal dimuat (${response.status})`);const rows=await response.json();const errors=validateInventory(rows);if(errors.length)throw Error(`Inventory tidak valid: ${errors.slice(0,3).join('; ')}`);return rows;}
