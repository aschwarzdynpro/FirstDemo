/**
 * Sprint 3 — Tests für:
 *   GET /api/user/usage
 *   freemiumLimit Middleware (429 nach 3 Analysen)
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express, { Response } from 'express';
import { createTestDb, signToken, JWT_SECRET } from './helpers';
import type { AuthenticatedRequest } from '../src/middleware/auth';

const testDb = createTestDb();
jest.mock('../src/db/client', () => ({ getDb: () => testDb, default: () => testDb }));
process.env.JWT_SECRET = JWT_SECRET;

import userRouter from '../src/routes/user';
import { freemiumLimit } from '../src/middleware/rateLimit';
import { authMiddleware } from '../src/middleware/auth';
import { incrementUsage } from '../src/services/usageTracker';

const FREE_USER = 'user-usage-free';
const PRO_USER  = 'user-usage-pro';

testDb.prepare(`INSERT OR IGNORE INTO users (id, email, plan) VALUES (?, ?, 'free')`).run(FREE_USER, 'usage-free@test.com');
testDb.prepare(`INSERT OR IGNORE INTO users (id, email, plan) VALUES (?, ?, 'pro')`).run(PRO_USER, 'usage-pro@test.com');

// App for /api/user routes
const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use('/api/user', userRouter);

// Minimal app to test freemiumLimit middleware
const limitApp = express();
limitApp.use(express.json());
limitApp.use(authMiddleware);
limitApp.get('/test', freemiumLimit, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ ok: true });
});

afterEach(() => {
  testDb.prepare('DELETE FROM usage WHERE user_id IN (?, ?)').run(FREE_USER, PRO_USER);
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/user/usage', () => {
  it('returns usage info for free user', async () => {
    const token = signToken(FREE_USER, 'usage-free@test.com');
    const res = await request(app)
      .get('/api/user/usage')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('free');
    expect(res.body.limit).toBe(3);
    expect(res.body.used).toBe(0);
  });

  it('returns unlimited (-1) for pro user', async () => {
    const token = signToken(PRO_USER, 'usage-pro@test.com');
    const res = await request(app)
      .get('/api/user/usage')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('pro');
    expect(res.body.limit).toBe(-1);
  });

  it('reflects current analysis count', async () => {
    incrementUsage(FREE_USER);
    incrementUsage(FREE_USER);
    const token = signToken(FREE_USER, 'usage-free@test.com');
    const res = await request(app)
      .get('/api/user/usage')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.used).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('freemiumLimit middleware', () => {
  it('passes through when under limit', async () => {
    incrementUsage(FREE_USER);
    const token = signToken(FREE_USER);
    const res = await request(limitApp)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 429 when free limit is exceeded', async () => {
    incrementUsage(FREE_USER);
    incrementUsage(FREE_USER);
    incrementUsage(FREE_USER);
    const token = signToken(FREE_USER);
    const res = await request(limitApp)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/freemium-limit/i);
    expect(res.body.usage.used).toBe(3);
  });

  it('always passes for pro user', async () => {
    for (let i = 0; i < 10; i++) incrementUsage(PRO_USER);
    const token = signToken(PRO_USER);
    const res = await request(limitApp)
      .get('/test')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
