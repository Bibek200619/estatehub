import 'dotenv/config';
import { randomBytes, scryptSync } from 'node:crypto';
import { db } from './db.js';

const password = process.env.DEMO_SEED_PASSWORD ?? '';
if (password.length < 12) throw new Error('Set DEMO_SEED_PASSWORD in .env to a local password of at least 12 characters before seeding.');
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
{
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
    ['Skyline calm at Bellandur', 'A bright apartment with a sheltered balcony, generous storage and easy access to the lakeside walking paths.', 'Apartment','Rent',61000,'Bellandur',1190,2,2,['Balcony','Lift','Gym','Power backup'],photos[2]],
    ['Brookefield garden-facing home', 'A well-planned family apartment with a leafy outlook, separate work nook and welcoming shared spaces.', 'Apartment','Buy',17600000,'Brookefield',1420,3,2,['Balcony','Clubhouse','Parking','Security'],photos[3]],
    ['The Marathahalli loft', 'A contemporary rental with tall windows, a flexible living area and quick access to everyday essentials.', 'Apartment','Rent',44000,'Marathahalli',980,2,2,['Furnished','Lift','Covered parking','Security'],photos[4]],
    ['JP Nagar sunroom residence', 'A cheerful apartment near neighbourhood parks, with a sunlit dining corner and practical family layout.', 'Apartment','Buy',14200000,'JP Nagar',1250,3,2,['Balcony','Children’s play area','Lift','Parking'],photos[5]],
    ['Malleshwaram morning home', 'A quiet apartment with warm finishes, cross ventilation and the character of an established neighbourhood.', 'Apartment','Rent',39000,'Malleshwaram',1050,2,2,['Furnished','Lift','Power backup','Pet friendly'],photos[6]],
    ['Banashankari courtyard villa', 'A spacious independent home arranged around a private garden, with room for family gatherings and quiet evenings.', 'House','Buy',28900000,'Banashankari',2380,4,3,['Private garden','Terrace','Parking','Study'],photos[7]],
    ['Kalyan Nagar corner apartment', 'A comfortable corner home with broad windows, useful storage and a relaxed community feel.', 'Apartment','Buy',13100000,'Kalyan Nagar',1160,2,2,['Balcony','Gym','Lift','Security'],photos[0]],
    ['Rajajinagar studio workspace', 'A versatile street-level commercial space with a bright frontage and flexible room for a growing team.', 'Commercial','Buy',21500000,'Rajajinagar',1540,0,1,['Street frontage','Parking','Power backup'],photos[1]],
    ['KR Puram family townhouse', 'A practical townhouse with a private entrance, a small patio and convenient access to the eastern corridor.', 'House','Rent',72000,'KR Puram',1980,3,3,['Patio','Parking','Security','Storage'],photos[2]],
    ['Varthur lakeview apartment', 'A light-filled rental with a balcony looking toward open green space and a well-equipped resident clubhouse.', 'Apartment','Rent',56000,'Varthur',1275,3,2,['Lake view','Balcony','Pool','Gym'],photos[3]],
    ['Basavanagudi heritage home', 'A lovingly maintained independent home with a shaded verandah, generous rooms and mature trees nearby.', 'House','Buy',36800000,'Basavanagudi',2640,4,3,['Verandah','Garden','Study','Parking'],photos[4]],
    ['Thanisandra smart two-bedroom', 'A fresh, efficient apartment with a flexible work corner, balcony and dependable building amenities.', 'Apartment','Rent',37000,'Thanisandra',920,2,2,['Balcony','Co-working','Lift','Security'],photos[5]],
    ['Devanahalli garden plot', 'A clearly sized residential plot with road access and utilities in a growing north Bengaluru neighbourhood.', 'Plot','Buy',8400000,'Devanahalli',1500,0,0,['Road access','Water nearby','Gated layout'],photos[6]],
    ['Ulsoor park-side apartment', 'A refined city apartment with leafy outlooks, generous daylight and a short walk to the lakeside park.', 'Apartment','Buy',26400000,'Ulsoor',1710,3,3,['Balcony','Concierge','Lift','Parking'],photos[7]],
    ['Richmond Town retail corner', 'A flexible commercial unit on a prominent corner, suited to a boutique studio, clinic or neighbourhood service.', 'Commercial','Rent',98000,'Richmond Town',1120,0,1,['Corner frontage','Reception','Power backup'],photos[0]],
    ['Yeshwanthpur compact apartment', 'A thoughtfully designed starter home with an efficient layout and quick access to transit and shops.', 'Apartment','Buy',9200000,'Yeshwanthpur',875,2,2,['Lift','Balcony','Parking','Security'],photos[1]],
    ['Hennur road family apartment', 'An airy apartment with a separate utility area, flexible family room and open views across the community.', 'Apartment','Rent',48000,'Hennur Road',1135,3,2,['Utility room','Balcony','Pool','Lift'],photos[2]],
    ['Cooke Town leafy apartment', 'A calm rental in a tree-lined pocket, refreshed with warm wood details and practical work-from-home space.', 'Apartment','Rent',84000,'Cooke Town',1380,2,2,['Furnished','Study nook','Lift','Pet friendly'],photos[3]],
    ['Sarjapur road starter apartment', 'A well-kept first home with a bright living room, protected balcony and everyday services close by.', 'Apartment','Buy',10800000,'Sarjapur Road',1040,2,2,['Balcony','Gym','Power backup','Parking'],photos[4]],
    ['Domlur garden apartment', 'A quiet apartment with mature greenery, an efficient layout and quick access to central Bengaluru offices.', 'Apartment','Rent',65000,'Domlur',1210,2,2,['Balcony','Lift','Power backup','Parking'],photos[5]],
  ] as const;
  const exists = db.prepare('SELECT id FROM properties WHERE title=? AND address=?');
  const transaction = db.transaction(() => listings.forEach((p,index) => {
    const address=`${p[5]}, Bengaluru`;
    if (!exists.get(p[0],address)) insert.run(owner.id,p[0],p[1],p[2],p[3],p[4],address,'Bengaluru',p[6],p[7],p[8],JSON.stringify(p[9]),JSON.stringify([p[10],photos[(index+1)%photos.length],photos[(index+3)%photos.length]]));
  }));
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
