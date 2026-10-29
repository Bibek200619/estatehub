import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomBytes, scryptSync } from 'node:crypto';
import type { AddressInfo } from 'node:net';

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.SESSION_SECRET = 'test-session-secret-that-is-not-used-in-production';

const { app } = await import('../server/index.js');
const { db } = await import('../server/db.js');
const password = 'TestPassword!2026';
type ApiResponse = { properties?:{id:number;active?:boolean;owner?:{name:string;email?:string}}[]; inquiries?:{propertyId:number;isReceived:boolean}[]; saved?:boolean; id?:number; error?:string };
const salt = randomBytes(16).toString('hex');
const passwordHash = `${salt}:${scryptSync(password,salt,64).toString('hex')}`;
let server: ReturnType<typeof app.listen>;
let base = '';

async function call(path:string, options:{method?:string;body?:unknown;cookie?:string;origin?:string} = {}) {
  const response = await fetch(`${base}${path}`, {
    method:options.method ?? 'GET',
    headers:{ ...(options.body ? {'content-type':'application/json'} : {}), ...(options.cookie ? {cookie:options.cookie} : {}), ...(options.origin?{origin:options.origin}:{}) },
    body:options.body ? JSON.stringify(options.body) : undefined,
  });
  return { response, data:await response.json() as ApiResponse };
}
function sessionCookie(response:Response) {
  const token=response.headers.get('set-cookie')?.match(/estatehub_session=([^;]+)/)?.[1];
  expect(token).toBeTruthy();
  return `estatehub_session=${token}`;
}

beforeAll(async()=>{
  const seeker= db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run('Sam Seeker','sam@example.test',passwordHash);
  const owner= db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run('Pat Provider','pat@example.test',passwordHash);
  db.prepare('INSERT INTO users(name,email,password_hash,is_admin) VALUES(?,?,?,1)').run('Ari Admin','ari@example.test',passwordHash);
  db.prepare(`INSERT INTO properties(owner_id,title,description,type,transaction_type,price,address,city,area_sqft,bedrooms,bathrooms,amenities_json,image_urls_json)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(Number(owner.lastInsertRowid),'Garden apartment','A calm, bright apartment with a private balcony and thoughtful storage.','Apartment','Buy',12000000,'Indiranagar, Bengaluru','Bengaluru',1200,2,2,'["Balcony"]','["https://example.com/home.jpg"]');
  void seeker;
  server=app.listen(0,'127.0.0.1');
  await new Promise<void>(resolve=>server.once('listening',resolve));
  base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(async()=>{
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  db.close();
});

describe('EstateHub API',()=>{
  it('supports search, accounts, favourites, inquiries, ownership and admin moderation',async()=>{
    expect((await call('/health')).response.status).toBe(200);
    const filtered=await call('/properties?q=Indiranagar&type=Apartment&transaction=Buy&maxPrice=15000000');
    expect(filtered.response.status).toBe(200);
    expect(filtered.data.properties).toHaveLength(1);
    expect(filtered.data.properties?.[0].owner).not.toHaveProperty('email');
    expect((await call('/properties?minPrice=200&maxPrice=100')).response.status).toBe(400);
    expect((await call('/auth/logout',{method:'POST',origin:'https://attacker.example'})).response.status).toBe(403);
    expect((await call('/favourites/1',{method:'POST'})).response.status).toBe(401);

    const invalidLogin=await call('/auth/login',{method:'POST',body:{email:'sam@example.test',password:'wrong'}});
    expect(invalidLogin.response.status).toBe(400);
    const login=await call('/auth/login',{method:'POST',body:{email:'sam@example.test',password}});
    expect(login.response.status).toBe(200);
    const seekerCookie=sessionCookie(login.response);

    expect((await call('/favourites/1',{method:'POST',cookie:seekerCookie})).response.status).toBe(201);
    expect((await call('/favourites',{cookie:seekerCookie})).data.properties?.map((p:{id:number})=>p.id)).toContain(1);
    expect((await call('/favourites/1',{method:'DELETE',cookie:seekerCookie})).data.saved).toBe(false);

    const inquiry=await call('/properties/1/inquiries',{method:'POST',cookie:seekerCookie,body:{message:'Could I arrange a time to see this home?'}});
    expect(inquiry.response.status).toBe(201);
    const provider=await call('/auth/login',{method:'POST',body:{email:'pat@example.test',password}});
    const providerCookie=sessionCookie(provider.response);
    expect((await call('/inquiries',{cookie:providerCookie})).data.inquiries?.[0].isReceived).toBe(true);
    expect((await call(`/inquiries/${inquiry.data.id}`,{method:'PATCH',cookie:seekerCookie,body:{status:'responded'}})).response.status).toBe(404);
    expect((await call('/properties/1',{method:'PATCH',cookie:seekerCookie,body:{title:'A different title'}})).response.status).toBe(403);
    expect((await call('/properties/1',{method:'PATCH',cookie:providerCookie,body:{availability:'pending'}})).response.status).toBe(200);

    const admin=await call('/auth/login',{method:'POST',body:{email:'ari@example.test',password}});
    const adminCookie=sessionCookie(admin.response);
    expect((await call('/admin/users',{cookie:seekerCookie})).response.status).toBe(403);
    const ownerId=(db.prepare('SELECT id FROM users WHERE email=?').get('pat@example.test') as {id:number}).id;
    const adminListing={title:'Admin-added Bellandur apartment',description:'A bright and well-kept rental home with useful amenities and a calm balcony.',type:'Apartment',transaction:'Rent',price:54000,address:'Bellandur, Bengaluru',city:'Bengaluru',areaSqft:1120,bedrooms:2,bathrooms:2,amenities:['Balcony','Lift'],imageUrls:['https://example.com/admin-home.jpg'],availability:'available',ownerId};
    expect((await call('/admin/properties',{method:'POST',cookie:seekerCookie,body:adminListing})).response.status).toBe(403);
    expect((await call('/admin/properties',{method:'POST',cookie:adminCookie,body:{...adminListing,ownerId:99999}})).response.status).toBe(400);
    const created=await call('/admin/properties',{method:'POST',cookie:adminCookie,body:adminListing});
    expect(created.response.status).toBe(201);
    const adminPropertyId=created.data.id!;
    expect((await call(`/favourites/${adminPropertyId}`,{method:'POST',cookie:seekerCookie})).response.status).toBe(201);
    expect((await call(`/properties/${adminPropertyId}/inquiries`,{method:'POST',cookie:seekerCookie,body:{message:'I would love to schedule a viewing for this home.'}})).response.status).toBe(201);
    expect((await call(`/admin/properties/${adminPropertyId}`,{method:'DELETE',cookie:seekerCookie})).response.status).toBe(403);
    expect((await call(`/admin/properties/${adminPropertyId}`,{method:'DELETE',cookie:adminCookie})).response.status).toBe(200);
    expect((await call(`/properties/${adminPropertyId}`)).response.status).toBe(404);
    expect((await call('/favourites',{cookie:seekerCookie})).data.properties?.some(p=>p.id===adminPropertyId)).toBe(false);
    expect((await call('/inquiries',{cookie:seekerCookie})).data.inquiries?.some(i=>i.propertyId===adminPropertyId)).toBe(false);
    expect((await call(`/admin/properties/${adminPropertyId}`,{method:'DELETE',cookie:adminCookie})).response.status).toBe(404);
    expect((await call('/admin/properties/1/status',{method:'PATCH',cookie:adminCookie,body:{active:false}})).response.status).toBe(200);
    expect((await call('/properties/1')).response.status).toBe(404);
  });

  it('registers a seeker and rejects duplicate email',async()=>{
    const body={name:'New Seeker',email:'new@example.test',password:'A-different-password-2026'};
    expect((await call('/auth/register',{method:'POST',body})).response.status).toBe(201);
    expect((await call('/auth/register',{method:'POST',body})).response.status).toBe(409);
  });
});
