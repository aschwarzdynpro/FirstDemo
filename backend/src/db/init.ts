import { getDb } from './client';

const db = getDb();
console.log('Database initialized successfully at', process.env.DATABASE_URL || './data/vertragscheck.db');
db.close();
