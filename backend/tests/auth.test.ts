/**
 * Sprint 3 — Tests für POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createTestDb, JWT_SECRET } from './helpers';

const testDb = createTestDb();
jest.mock('../src/db/client', () => ({ getDb: () => testDb, default: () => testDb }));

jest.mock('../src/services/email', () => ({
  sendWelcomeEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendUpgradeConfirmationEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

process.env.JWT_SECRET = JWT_SECRET;

import authRouter from '../src/routes/auth';
import { authMiddleware } from '../src/middleware/auth';

const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use('/api/auth', authRouter);

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  afterEach(() => {
    testDb.prepare("DELETE FROM users WHERE email LIKE '%@register.test'").run();
  });

  it('creates a new user and returns a JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@register.test', password: 'sicher123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@register.test');
    expect(res.body.user.plan).toBe('free');
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'sicher123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for password shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bob@register.test', password: '1234567' });
    expect(res.status).toBe(400);
  });

  it('returns 409 for duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@register.test', password: 'sicher123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@register.test', password: 'anderes123' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/bereits registriert/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  const EMAIL    = 'login-user@login.test';
  const PASSWORD = 'meinPasswort1';

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD });
  });

  afterAll(() => {
    testDb.prepare("DELETE FROM users WHERE email = ?").run(EMAIL);
  });

  it('returns a JWT on correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(EMAIL);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'falschesPasswort' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@login.test', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing body fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL }); // no password
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  const EMAIL    = 'me-user@me.test';
  const PASSWORD = 'meinPasswort2';
  let token: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD });
    token = res.body.token as string;
  });

  afterAll(() => {
    testDb.prepare("DELETE FROM users WHERE email = ?").run(EMAIL);
  });

  it('returns user info for valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(EMAIL);
  });

  it('returns 401 for missing Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer totally.invalid.token');
    expect(res.status).toBe(401);
  });
});
