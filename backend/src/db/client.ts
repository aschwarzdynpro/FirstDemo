import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DATABASE_URL || './data/vertragscheck.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);

    // Migrations: add columns added after initial release
    runMigrations(db);
  }
  return db;
}

function runMigrations(db: Database.Database): void {
  const cols = (db.pragma('table_info(users)') as Array<{ name: string }>).map((c) => c.name);
  if (!cols.includes('password_hash')) {
    db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
  }
  if (!cols.includes('password_salt')) {
    db.exec('ALTER TABLE users ADD COLUMN password_salt TEXT');
  }
}

export default getDb;
