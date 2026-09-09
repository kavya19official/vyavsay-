import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const tables = ['contracts','milestones','submissions','invoices','payments','attempts','disputes','audit','notifications','commands'];
export function createStore(filename = path.join(import.meta.dirname, '../data/feature8.sqlite')) {
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  for (const table of tables) db.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)))`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS one_payment_per_milestone ON payments(json_extract(data,'$.milestoneId'));
    CREATE UNIQUE INDEX IF NOT EXISTS unique_invoice ON invoices(json_extract(data,'$.identity'));
    CREATE UNIQUE INDEX IF NOT EXISTS notification_dedupe ON notifications(json_extract(data,'$.dedupeKey'));
    CREATE UNIQUE INDEX IF NOT EXISTS command_dedupe ON commands(json_extract(data,'$.identity'));
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT OR IGNORE INTO settings VALUES ('clockOffsetDays','0');
    INSERT OR IGNORE INTO settings VALUES ('lastDeadlineCheck','');`);
  function load() {
    const s = Object.fromEntries(tables.map(t => [t,db.prepare(`SELECT data FROM ${t}`).all().map(r=>JSON.parse(r.data))]));
    s.clockOffsetDays=Number(db.prepare("SELECT value FROM settings WHERE id='clockOffsetDays'").get().value);
    s.lastDeadlineCheck=db.prepare("SELECT value FROM settings WHERE id='lastDeadlineCheck'").get().value;
    return s;
  }
  return {
    read:load,
    transaction(fn) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const state=load();
        const previous=Object.fromEntries(tables.map(t=>[t,new Map(state[t].map(r=>[r.id,JSON.stringify(r)]))]));
        const result=fn(state);
        for(const t of tables) {
          const insert=db.prepare(`INSERT INTO ${t} VALUES (?,?)`), update=db.prepare(`UPDATE ${t} SET data=? WHERE id=?`);
          for(const row of state[t]) {
            const value=JSON.stringify(row), old=previous[t].get(row.id);
            if(old===undefined)insert.run(row.id,value);
            else if(old!==value) {
              if(['audit','submissions'].includes(t))throw new Error('Immutable history cannot be overwritten');
              update.run(value,row.id);
            }
          }
        }
        db.prepare("UPDATE settings SET value=? WHERE id='clockOffsetDays'").run(String(state.clockOffsetDays));
        db.prepare("UPDATE settings SET value=? WHERE id='lastDeadlineCheck'").run(state.lastDeadlineCheck);
        db.exec('COMMIT'); return result;
      }catch(e){db.exec('ROLLBACK');throw e;}
    },
    session(token,accountId,expires){db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(token,accountId,expires);},
    getSession(token){return db.prepare('SELECT account_id FROM sessions WHERE token=? AND expires>?').get(token,Date.now());},
    close(){db.close();}
  };
}
