import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, describe, expect, it } from 'vitest';

const directory=mkdtempSync(join(tmpdir(),'estatehub-seed-'));
const databasePath=join(directory,'seed.sqlite');
const environment={...process.env,NODE_ENV:'test',DATABASE_PATH:databasePath,DEMO_SEED_PASSWORD:'seed-password-for-tests'};
const seed=()=>execFileSync(process.execPath,['--import','tsx','server/seed.ts'],{cwd:process.cwd(),env:environment,stdio:'pipe'});

afterAll(()=>rmSync(directory,{recursive:true,force:true}));

describe('demo seed inventory',()=>{
  it('adds a broad location catalog idempotently and preserves user listings',()=>{
    seed();
    let db=new Database(databasePath);
    const first=db.prepare('SELECT COUNT(*) AS count FROM properties').get() as {count:number};
    const categories=db.prepare('SELECT type,transaction_type FROM properties GROUP BY type,transaction_type').all() as {type:string;transaction_type:string}[];
    const locations=db.prepare('SELECT COUNT(DISTINCT address) AS count FROM properties').get() as {count:number};
    expect(first.count).toBeGreaterThanOrEqual(30);
    expect(locations.count).toBeGreaterThanOrEqual(29);
    expect(categories.map(row=>row.type)).toEqual(expect.arrayContaining(['Apartment','House','Plot','Commercial']));
    expect(categories.map(row=>row.transaction_type)).toEqual(expect.arrayContaining(['Buy','Rent']));
    db.prepare(`INSERT INTO properties(owner_id,title,description,type,transaction_type,price,address,city,area_sqft,bedrooms,bathrooms)
      VALUES((SELECT id FROM users WHERE email='arjun@estatehub.demo'),'Owner-created listing','This owner record must remain unchanged when sample data is refreshed.','Apartment','Buy',10000000,'Test Place, Bengaluru','Bengaluru',1000,2,2)`).run();
    db.close();

    seed();
    db=new Database(databasePath);
    const second=db.prepare('SELECT COUNT(*) AS count FROM properties').get() as {count:number};
    const custom=db.prepare('SELECT id FROM properties WHERE title=?').get('Owner-created listing');
    expect(second.count).toBe(first.count+1);
    expect(custom).toBeTruthy();
    db.close();
  });
});
