import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

export function createStore(filename = path.join(import.meta.dirname, '../data/feature9.sqlite')) {
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
    INSERT OR IGNORE INTO state VALUES (1, '{"rounds":[],"assignments":[],"decisions":[],"appeals":[],"flags":[],"notifications":[],"commands":[],"replacements":[],"demoRevisions":{}}');
    CREATE TABLE IF NOT EXISTS audit (seq INTEGER PRIMARY KEY, data TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
    CREATE TABLE IF NOT EXISTS immutable (id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS immutable_no_update BEFORE UPDATE ON immutable BEGIN SELECT RAISE(ABORT,'Evidence and decisions are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS immutable_no_delete BEFORE DELETE ON immutable BEGIN SELECT RAISE(ABORT,'Evidence and decisions are immutable'); END;
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, actor TEXT NOT NULL, expires INTEGER NOT NULL);`);
  const read = () => ({ ...JSON.parse(db.prepare('SELECT data FROM state WHERE id=1').get().data), audit: db.prepare('SELECT data FROM audit ORDER BY seq').all().map(r => JSON.parse(r.data)) });
  return {
    read,
    transaction(fn) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const state = read(), before = state.audit.map(e => JSON.stringify(e));
        const result = fn(state);
        if (state.audit.length < before.length || before.some((v, i) => JSON.stringify(state.audit[i]) !== v)) throw Error('Audit history cannot change');
        for (const r of state.rounds) persistImmutable(`snapshot:${r.id}`, 'snapshot', r.snapshot);
        for (const d of state.decisions) persistImmutable(`decision:${d.id}`, 'decision', d);
        for (const e of state.audit.slice(before.length)) db.prepare('INSERT INTO audit VALUES (?, ?)').run(e.seq, JSON.stringify(e));
        const { audit, ...rest } = state;
        db.prepare('UPDATE state SET data=? WHERE id=1').run(JSON.stringify(rest));
        db.exec('COMMIT'); return result;
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    session(token, actor) { db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(token, actor, Date.now() + 8*3600000); },
    actor(token) { return db.prepare('SELECT actor FROM sessions WHERE token=? AND expires>?').get(token || '', Date.now())?.actor; },
    close() { db.close(); },
  };
  function persistImmutable(id, kind, data) {
    const value = JSON.stringify(data), previous = db.prepare('SELECT data FROM immutable WHERE id=?').get(id);
    if (previous && previous.data !== value) throw Error('Snapshot or decision cannot be overwritten');
    if (!previous) db.prepare('INSERT INTO immutable VALUES (?,?,?)').run(id, kind, value);
  }
}
