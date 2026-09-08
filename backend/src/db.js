import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, "data", "seed.json");
const STORE_PATH = path.join(__dirname, "data", "store.json");

function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.copyFileSync(SEED_PATH, STORE_PATH);
  }
}

export function readDB() {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}

export function writeDB(db) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(db, null, 2));
}

/** Reset the store back to the original seed data (used by POST /api/admin/reset). */
export function resetDB() {
  fs.copyFileSync(SEED_PATH, STORE_PATH);
  return readDB();
}
