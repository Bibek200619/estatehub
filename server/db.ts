import 'dotenv/config';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const configuredFile = process.env.DATABASE_PATH ?? './data/estatehub.sqlite';
const file = configuredFile === ':memory:' ? configuredFile : resolve(configuredFile);
if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });

export const db = new Database(file);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL,
    description TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('Apartment','House','Plot','Commercial')),
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('Buy','Rent')), price INTEGER NOT NULL CHECK(price > 0),
    address TEXT NOT NULL, city TEXT NOT NULL, area_sqft INTEGER NOT NULL CHECK(area_sqft > 0),
    bedrooms INTEGER NOT NULL DEFAULT 0, bathrooms INTEGER NOT NULL DEFAULT 0,
    amenities_json TEXT NOT NULL DEFAULT '[]', image_urls_json TEXT NOT NULL DEFAULT '[]',
    availability TEXT NOT NULL DEFAULT 'available' CHECK(availability IN ('available','pending','unavailable')),
    active INTEGER NOT NULL DEFAULT 1, published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS favourites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, property_id)
  );
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
    property_id INTEGER NOT NULL REFERENCES properties(id), message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','responded')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS properties_search ON properties(city, type, transaction_type, price, availability, active);
  CREATE INDEX IF NOT EXISTS properties_owner ON properties(owner_id);
  CREATE INDEX IF NOT EXISTS inquiries_property ON inquiries(property_id, created_at);
  CREATE INDEX IF NOT EXISTS inquiries_user ON inquiries(user_id, created_at);
`);

export const oneDay = 60 * 60 * 24;
