import 'dotenv/config';
import { randomBytes, scryptSync } from 'node:crypto';
import { db } from './db.js';

const password = process.env.DEMO_SEED_PASSWORD ?? 'EstateHubDemo!2026';
if (password.length < 12) throw new Error('DEMO_SEED_PASSWORD must contain at least 12 characters.');
const hashPassword = (value: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(value, salt, 64).toString('hex')}`;
};
const photos = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82',
];

const addUser = db.prepare('INSERT OR IGNORE INTO users(name,email,password_hash,is_admin) VALUES(?,?,?,?)');
addUser.run('Maya Rao', 'maya@estatehub.demo', hashPassword(password), 0);
addUser.run('Arjun Mehta', 'arjun@estatehub.demo', hashPassword(password), 0);
addUser.run('EstateHub Admin', 'admin@estatehub.demo', hashPassword(password), 1);

const owner = db.prepare('SELECT id FROM users WHERE email=?').get('arjun@estatehub.demo') as { id: number };
const count = db.prepare('SELECT COUNT(*) AS n FROM properties').get() as { n: number };
if (count.n === 0) {
  const insert = db.prepare(`INSERT INTO properties(owner_id,title,description,type,transaction_type,price,address,city,area_sqft,bedrooms,bathrooms,amenities_json,image_urls_json)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const listings = [
    ['Light-filled corner apartment', 'A generous, sunlit home with a thoughtful open plan, quiet balcony and easy access to the neighbourhood. Recently refreshed and ready for its next chapter.', 'Apartment','Buy',18500000,'Indiranagar',1470,3,2,['Balcony','Lift','Power backup','Covered parking'],photos[0]],
    ['The Courtyard House', 'A private garden home designed around a leafy central courtyard. Natural materials, generous entertaining space and a calm residential setting.', 'House','Buy',32500000,'Whitefield',2480,4,3,['Private garden','Study','Parking','Security'],photos[1]],
    ['Warm minimal, near the park', 'A carefully maintained apartment with warm timber details, large windows and an easy walk to cafés and green space.', 'Apartment','Rent',68000,'Jayanagar',1280,2,2,['Furnished','Gym','Lift','Pet friendly'],photos[2]],
    ['North-facing family home', 'Spacious rooms and a relaxed contemporary finish make this home a comfortable place to settle in. Close to schools and everyday conveniences.', 'House','Buy',24700000,'Sarjapur Road',2160,3,3,['Clubhouse','Pool','Two parking','Security'],photos[3]],
    ['A quieter kind of city living', 'A bright apartment in a well-connected neighbourhood, with a sheltered balcony and thoughtful storage throughout.', 'Apartment','Rent',52000,'Koramangala',1100,2,2,['Balcony','Lift','Power backup','Furnished'],photos[4]],
    ['Oak & stone residence', 'An elegant family residence with clean lines, indoor-outdoor flow and space to host. A few minutes from the city’s best everyday amenities.', 'House','Buy',41200000,'Hebbal',3050,4,4,['Garden','Terrace','Security','Parking'],photos[5]],
    ['Compact studio, considered living', 'A well-planned city studio with built-in storage, excellent natural light and shared work and fitness spaces in the building.', 'Apartment','Rent',34000,'HSR Layout',690,1,1,['Co-working','Gym','Lift','Security'],photos[6]],
    ['A small plot with room to grow', 'A residential plot in an established neighbourhood with road access and utilities nearby. Sample listing for demonstration only.', 'Plot','Buy',9600000,'Yelahanka',1200,0,0,['Road access','Water nearby','Clear dimensions'],photos[7]],
    ['Garden-view workspace', 'A practical, light-filled commercial space suited to a small team, with a flexible layout and dependable building services.', 'Commercial','Rent',125000,'MG Road',1850,0,2,['Reception','Parking','Power backup','Lift'],photos[0]],
    ['The morning light apartment', 'An airy home with a long balcony, quiet interiors and generous shared amenities. Convenient for a quick city commute.', 'Apartment','Buy',15800000,'Electronic City',1360,3,2,['Balcony','Pool','Gym','Security'],photos[1]],
  ] as const;
  const transaction = db.transaction(() => listings.forEach((p,index) => insert.run(owner.id,p[0],p[1],p[2],p[3],p[4],`${p[5]}, Bengaluru`, 'Bengaluru',p[6],p[7],p[8],JSON.stringify(p[9]),JSON.stringify([p[10],photos[(index+1)%photos.length],photos[(index+3)%photos.length]]))));
  transaction();
}
const demoRows=db.prepare('SELECT id,image_urls_json FROM properties WHERE owner_id=?').all(owner.id) as {id:number;image_urls_json:string}[];
const knownPhotos=new Set(photos);
const updatePhotos=db.prepare('UPDATE properties SET image_urls_json=? WHERE id=?');
for(const row of demoRows){
  const current=JSON.parse(row.image_urls_json) as string[];
  if(current.length===1&&knownPhotos.has(current[0])) updatePhotos.run(JSON.stringify([current[0],photos[row.id%photos.length],photos[(row.id+3)%photos.length]]),row.id);
}
console.log('EstateHub demo data is ready. Demo accounts: maya@estatehub.demo, arjun@estatehub.demo, admin@estatehub.demo');
console.log(`All demo accounts use the configured DEMO_SEED_PASSWORD (${password.length} characters). Change it in .env before sharing a demo environment.`);
