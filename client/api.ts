export type User = { id:number; name:string; email:string; isAdmin:boolean };
export type Property = {
  id:number; ownerId:number; title:string; description:string; type:'Apartment'|'House'|'Plot'|'Commercial'; transaction:'Buy'|'Rent';
  price:number; address:string; city:string; areaSqft:number; bedrooms:number; bathrooms:number; amenities:string[]; imageUrls:string[];
  availability:'available'|'pending'|'unavailable'; publishedAt:string; updatedAt:string; active?:boolean; owner:{name:string;email?:string};
};
export type Inquiry = { id:number; propertyId:number; propertyTitle:string; message:string; status:'new'|'read'|'responded'; createdAt:string; isReceived:boolean; sender:{name:string;email:string}; imageUrl:string };

export async function api<T>(path:string, options:RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, credentials:'include', headers:{ ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body as T;
}
export const currency = (amount:number, transaction?:string) => {
  const compact = amount >= 10_000_000 ? `₹${(amount/10_000_000).toFixed(amount%10_000_000===0?0:2)} Cr` : amount >= 100_000 ? `₹${(amount/100_000).toFixed(amount%100_000===0?0:1)} L` : `₹${amount.toLocaleString('en-IN')}`;
  return `${compact}${transaction==='Rent'?' / mo':''}`;
};
