import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { db, oneDay } from './db.js';

type User = { id: number; name: string; email: string; is_admin: number };
type AuthRequest = Request & { user?: User };
const app = express();
const production = process.env.NODE_ENV === 'production';
const cookieName = production ? '__Host-estatehub' : 'estatehub_session';
app.disable('x-powered-by');
app.set('trust proxy', production ? 1 : false);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc:["'self'"], scriptSrc:["'self'"], styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'], fontSrc:["'self'",'data:','https://fonts.gstatic.com'], imgSrc:["'self'",'data:','https:'], connectSrc:["'self'"], objectSrc:["'none'"], baseUri:["'self'"], frameAncestors:["'none'"] } } }));
app.use(express.json({ limit: '30kb' }));
app.use((req, res, next) => {
  if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const requestOrigin = `${req.protocol}://${req.get('host')}`;
        const devOrigin = !production && ['http://localhost:5173','http://127.0.0.1:5173'].includes(originUrl.origin);
        if (originUrl.origin !== requestOrigin && !devOrigin) return res.status(403).json({ error: 'Cross-origin request blocked.' });
      } catch { return res.status(403).json({ error: 'Invalid request origin.' }); }
    }
  }
  next();
});

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
function getCookie(req: Request, name: string) {
  const raw = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return raw ? decodeURIComponent(raw.slice(name.length + 1)) : undefined;
}
function safeUser(user: User) { return { id: user.id, name: user.name, email: user.email, isAdmin: Boolean(user.is_admin) }; }
function userFromToken(req: Request): User | undefined {
  const token = getCookie(req, cookieName);
  if (!token) return undefined;
  const row = db.prepare(`SELECT u.id,u.name,u.email,u.is_admin FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).get(hashToken(token), Date.now()) as User | undefined;
  return row;
}
function requireUser(req: AuthRequest, res: Response, next: NextFunction) {
  const user = userFromToken(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });
  req.user = user;
  next();
}
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'Administrator access required.' });
  next();
}
function setSession(userId: number, res: Response) {
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(hashToken(token), userId, Date.now() + oneDay * 7 * 1000);
  res.cookie(cookieName, token, { httpOnly: true, sameSite: 'lax', secure: production, path: '/', maxAge: oneDay * 7 * 1000 });
}
function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password: string, encoded: string) {
  const [salt, expected] = encoded.split(':');
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const target = Buffer.from(expected, 'hex');
  return actual.length === target.length && timingSafeEqual(actual, target);
}

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many attempts. Please wait a little and try again.' } });
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/auth/me', (req, res) => {
  const user = userFromToken(req);
  res.json({ user: user ? safeUser(user) : null });
});
const authSchema = z.object({ email: z.email().max(254).transform((value) => value.trim().toLowerCase()), password: z.string().min(12).max(128) });
app.post('/api/auth/register', authLimit, (req, res) => {
  const parsed = authSchema.extend({ name: z.string().trim().min(2).max(80) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Check your details.' });
  const { name, email, password } = parsed.data;
  try {
    const result = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name, email, passwordHash(password));
    db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
    setSession(Number(result.lastInsertRowid), res);
    const user = db.prepare('SELECT id,name,email,is_admin FROM users WHERE id=?').get(result.lastInsertRowid) as User;
    return res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE')) return res.status(409).json({ error: 'An account with this email already exists.' });
    throw error;
  }
});
app.post('/api/auth/login', authLimit, (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and a password of at least 12 characters.' });
  const row = db.prepare('SELECT id,name,email,password_hash,is_admin FROM users WHERE email=?').get(parsed.data.email) as (User & { password_hash: string }) | undefined;
  if (!row || !verifyPassword(parsed.data.password, row.password_hash)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  const old = getCookie(req, cookieName);
  if (old) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(old));
  db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
  setSession(row.id, res);
  return res.json({ user: safeUser(row) });
});
app.post('/api/auth/logout', (req, res) => {
  const token = getCookie(req, cookieName);
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(token));
  res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: production, path: '/' });
  res.json({ ok: true });
});

const propertyFields = {
  title: z.string().trim().min(5).max(120), description: z.string().trim().min(30).max(5000),
  type: z.enum(['Apartment','House','Plot','Commercial']), transaction: z.enum(['Buy','Rent']),
  price: z.coerce.number().int().positive().max(2_000_000_000), address: z.string().trim().min(3).max(180),
  city: z.string().trim().min(2).max(80), areaSqft: z.coerce.number().int().positive().max(1_000_000),
  bedrooms: z.coerce.number().int().min(0).max(30), bathrooms: z.coerce.number().int().min(0).max(30),
  amenities: z.array(z.string().trim().min(1).max(60)).max(20),
  imageUrls: z.array(z.url().max(500).refine(value=>new URL(value).protocol==='https:',{message:'Photo URLs must use HTTPS.'})).min(1).max(8), availability: z.enum(['available','pending','unavailable']).default('available'),
};
const propertySchema = z.object(propertyFields);
const selectProperty = `SELECT p.*,u.name AS owner_name FROM properties p JOIN users u ON u.id=p.owner_id`;
function propertyRecord(row: Record<string, unknown>) {
  return {
    id: row.id, ownerId: row.owner_id, title: row.title, description: row.description, type: row.type,
    transaction: row.transaction_type, price: row.price, address: row.address, city: row.city,
    areaSqft: row.area_sqft, bedrooms: row.bedrooms, bathrooms: row.bathrooms,
    amenities: JSON.parse(String(row.amenities_json)), imageUrls: JSON.parse(String(row.image_urls_json)),
    availability: row.availability, publishedAt: row.published_at, updatedAt: row.updated_at,
    owner: { name: row.owner_name }, active: Boolean(row.active),
  };
}
app.get('/api/properties', (req, res) => {
  const querySchema = z.object({ q: z.string().trim().max(100).optional(), type: z.enum(['Apartment','House','Plot','Commercial']).optional(), transaction: z.enum(['Buy','Rent']).optional(), minPrice: z.coerce.number().min(0).optional(), maxPrice: z.coerce.number().min(0).optional(), bedrooms: z.coerce.number().int().min(0).max(30).optional(), sort: z.enum(['recommended','price-low','price-high','newest']).default('recommended'), limit: z.coerce.number().int().min(1).max(100).default(50) });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'One or more filters are invalid.' });
  const f = parsed.data;
  if (f.minPrice && f.maxPrice && f.minPrice > f.maxPrice) return res.status(400).json({ error: 'Minimum price must be less than maximum price.' });
  const conditions = ["p.active=1", "p.availability IN ('available','pending')"];
  const values: (string|number)[] = [];
  if (f.q) { conditions.push('(p.city LIKE ? OR p.address LIKE ? OR p.title LIKE ?)'); const term = `%${f.q}%`; values.push(term,term,term); }
  if (f.type) { conditions.push('p.type=?'); values.push(f.type); }
  if (f.transaction) { conditions.push('p.transaction_type=?'); values.push(f.transaction); }
  if (f.minPrice !== undefined) { conditions.push('p.price>=?'); values.push(f.minPrice); }
  if (f.maxPrice !== undefined) { conditions.push('p.price<=?'); values.push(f.maxPrice); }
  if (f.bedrooms !== undefined) { conditions.push('p.bedrooms>=?'); values.push(f.bedrooms); }
  const order = f.sort === 'price-low' ? 'p.price ASC' : f.sort === 'price-high' ? 'p.price DESC' : f.sort === 'newest' ? 'p.published_at DESC' : 'p.id DESC';
  const rows = db.prepare(`${selectProperty} WHERE ${conditions.join(' AND ')} ORDER BY ${order} LIMIT ?`).all(...values, f.limit) as Record<string, unknown>[];
  res.json({ properties: rows.map(propertyRecord), total: rows.length });
});
app.get('/api/properties/mine', requireUser, (req: AuthRequest, res) => {
  const rows = db.prepare(`${selectProperty} WHERE p.owner_id=? ORDER BY p.updated_at DESC`).all(req.user!.id) as Record<string, unknown>[];
  res.json({ properties: rows.map(propertyRecord) });
});
app.get('/api/properties/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid property id.' });
  const row = db.prepare(`${selectProperty} WHERE p.id=? AND p.active=1`).get(id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: 'Property not found.' });
  res.json({ property: propertyRecord(row) });
});
app.post('/api/properties', requireUser, (req: AuthRequest, res) => {
  const parsed = propertySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Review the listing details.' });
  const p = parsed.data;
  const result = db.prepare(`INSERT INTO properties(owner_id,title,description,type,transaction_type,price,address,city,area_sqft,bedrooms,bathrooms,amenities_json,image_urls_json,availability)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(req.user!.id,p.title,p.description,p.type,p.transaction,p.price,p.address,p.city,p.areaSqft,p.bedrooms,p.bathrooms,JSON.stringify(p.amenities),JSON.stringify(p.imageUrls),p.availability);
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});
app.patch('/api/properties/:id', requireUser, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id,owner_id FROM properties WHERE id=? AND active=1').get(id) as { id: number; owner_id: number } | undefined;
  if (!existing) return res.status(404).json({ error: 'Property not found.' });
  if (existing.owner_id !== req.user!.id && !req.user!.is_admin) return res.status(403).json({ error: 'You can only edit your own listings.' });
  const parsed = propertySchema.partial().safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return res.status(400).json({ error: parsed.success ? 'Provide at least one valid field.' : parsed.error.issues[0]?.message });
  const p = parsed.data;
  const columns: Record<string, unknown> = { ...p, transaction_type: p.transaction, area_sqft: p.areaSqft, amenities_json: p.amenities ? JSON.stringify(p.amenities) : undefined, image_urls_json: p.imageUrls ? JSON.stringify(p.imageUrls) : undefined, updated_at: new Date().toISOString() };
  delete columns.areaSqft; delete columns.amenities; delete columns.imageUrls; delete columns.transaction;
  const entries = Object.entries(columns).filter(([,value]) => value !== undefined);
  db.prepare(`UPDATE properties SET ${entries.map(([key]) => `${key}=?`).join(',')} WHERE id=?`).run(...entries.map(([,value]) => value as string|number), id);
  res.json({ ok: true });
});
app.delete('/api/properties/:id', requireUser, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const item = db.prepare('SELECT owner_id FROM properties WHERE id=?').get(id) as { owner_id: number } | undefined;
  if (!item) return res.status(404).json({ error: 'Property not found.' });
  if (item.owner_id !== req.user!.id && !req.user!.is_admin) return res.status(403).json({ error: 'You can only remove your own listings.' });
  db.prepare("UPDATE properties SET active=0,updated_at=? WHERE id=?").run(new Date().toISOString(), id);
  res.json({ ok: true });
});
app.get('/api/favourites', requireUser, (req: AuthRequest, res) => {
  const rows = db.prepare(`${selectProperty} JOIN favourites f ON f.property_id=p.id WHERE f.user_id=? AND p.active=1 ORDER BY f.created_at DESC`).all(req.user!.id) as Record<string, unknown>[];
  res.json({ properties: rows.map(propertyRecord) });
});
app.post('/api/favourites/:id', requireUser, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM properties WHERE id=? AND active=1').get(id)) return res.status(404).json({ error: 'Property not found.' });
  db.prepare('INSERT OR IGNORE INTO favourites(user_id,property_id) VALUES(?,?)').run(req.user!.id,id);
  res.status(201).json({ saved: true });
});
app.delete('/api/favourites/:id', requireUser, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM favourites WHERE user_id=? AND property_id=?').run(req.user!.id,Number(req.params.id));
  res.json({ saved: false });
});

const inquiryLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 15, standardHeaders: 'draft-8', legacyHeaders: false });
app.post('/api/properties/:id/inquiries', requireUser, inquiryLimit, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const parsed = z.object({ message: z.string().trim().min(15).max(2000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Write a message between 15 and 2,000 characters.' });
  if (!db.prepare("SELECT id FROM properties WHERE id=? AND active=1 AND availability='available'").get(id)) return res.status(404).json({ error: 'This property is no longer accepting inquiries.' });
  const result = db.prepare('INSERT INTO inquiries(user_id,property_id,message) VALUES(?,?,?)').run(req.user!.id,id,parsed.data.message);
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});
app.get('/api/inquiries', requireUser, (req: AuthRequest, res) => {
  const rows = db.prepare(`SELECT i.*,p.title,p.owner_id,p.image_urls_json,u.name AS sender_name,u.email AS sender_email
    FROM inquiries i JOIN properties p ON p.id=i.property_id JOIN users u ON u.id=i.user_id
    WHERE i.user_id=? OR p.owner_id=? OR ?=1 ORDER BY i.created_at DESC`).all(req.user!.id,req.user!.id,req.user!.is_admin) as Record<string, unknown>[];
  res.json({ inquiries: rows.map((r) => ({ id:r.id,propertyId:r.property_id,propertyTitle:r.title,message:r.message,status:r.status,createdAt:r.created_at,isReceived:r.owner_id===req.user!.id,sender:{name:r.sender_name,email:r.sender_email},imageUrl:JSON.parse(String(r.image_urls_json))[0] })) });
});
app.patch('/api/inquiries/:id', requireUser, (req: AuthRequest, res) => {
  const parsed = z.object({ status:z.enum(['read','responded']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error:'Choose a valid inquiry status.' });
  const allowed = db.prepare('SELECT i.id FROM inquiries i JOIN properties p ON p.id=i.property_id WHERE i.id=? AND (p.owner_id=? OR ?=1)').get(Number(req.params.id),req.user!.id,req.user!.is_admin);
  if (!allowed) return res.status(404).json({ error:'Inquiry not found.' });
  db.prepare('UPDATE inquiries SET status=?,updated_at=? WHERE id=?').run(parsed.data.status,new Date().toISOString(),Number(req.params.id));
  res.json({ ok:true });
});

app.get('/api/admin/users', requireUser, requireAdmin, (_req,res) => {
  const users = db.prepare('SELECT id,name,email,is_admin,created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});
app.get('/api/admin/properties', requireUser, requireAdmin, (_req,res) => {
  const rows = db.prepare(`${selectProperty} ORDER BY p.updated_at DESC`).all() as Record<string, unknown>[];
  res.json({ properties: rows.map(propertyRecord) });
});
app.patch('/api/admin/properties/:id/status', requireUser, requireAdmin, (req,res) => {
  const parsed = z.object({ active:z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error:'Invalid moderation status.' });
  const result = db.prepare('UPDATE properties SET active=?,updated_at=? WHERE id=?').run(parsed.data.active?1:0,new Date().toISOString(),Number(req.params.id));
  if (result.changes===0) return res.status(404).json({ error:'Property not found.' });
  res.json({ ok:true });
});

app.use('/api', (_req,res) => res.status(404).json({ error:'API route not found.' }));
const clientDist = resolve('dist');
if (production && existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*splat', (_req,res) => res.sendFile(resolve(clientDist,'index.html')));
}
app.use((error: unknown,_req:Request,res:Response,_next:NextFunction) => {
  void _next;
  console.error(error);
  res.status(500).json({ error:'Something went wrong. Please try again.' });
});

const port = Number(process.env.PORT ?? 3001);
if (process.env.NODE_ENV !== 'test') app.listen(port, () => console.log(`EstateHub API listening on http://localhost:${port}`));

export { app };
