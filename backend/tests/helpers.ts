/**
 * Shared test helpers — creates an in-memory SQLite DB and a signed JWT
 * so individual test files don't have to repeat the setup.
 */
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const SCHEMA_PATH = path.join(__dirname, '../src/db/schema.sql');

/** Build an isolated in-memory database and monkey-patch the module singleton. */
export function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  // stripe_customer_id was added after the initial schema
  db.exec('ALTER TABLE users ADD COLUMN stripe_customer_id TEXT');
  return db;
}

export const JWT_SECRET = 'test-secret';

export function signToken(userId: string, email = 'test@example.com'): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
}
