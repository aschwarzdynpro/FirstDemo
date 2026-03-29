/**
 * Tests for POST /api/stripe/create-checkout-session
 *
 * Stripe SDK is mocked so no real network calls are made.
 */
import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// ── Mock Stripe before importing the route ──────────────────────────────────
const mockCreate = jest.fn<() => Promise<{ url: string }>>().mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockCreate,
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

// ── Mock DB ──────────────────────────────────────────────────────────────────
import { createTestDb, signToken, JWT_SECRET } from './helpers';

const testDb = createTestDb();
const TEST_USER_ID = 'user-stripe-test';
testDb.prepare(`INSERT INTO users (id, email, plan) VALUES (?, ?, 'pro')`).run(TEST_USER_ID, 'stripe@test.com');

jest.mock('../src/db/client', () => ({ getDb: () => testDb }));

// ── Mock email service ───────────────────────────────────────────────────────
jest.mock('../src/services/email', () => ({
  sendUpgradeConfirmationEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

// ── Import route after mocks ─────────────────────────────────────────────────
process.env.JWT_SECRET = JWT_SECRET;
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_PRICE_PRO = 'price_pro_test';
process.env.STRIPE_PRICE_BUSINESS = 'price_business_test';

import stripeRouter from '../src/routes/stripe';
import { authMiddleware } from '../src/middleware/auth';

const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use('/api/stripe', stripeRouter);

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/stripe/create-checkout-session', () => {
  const token = signToken(TEST_USER_ID, 'stripe@test.com');

  it('returns 400 for missing plan', async () => {
    const res = await request(app)
      .post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ungültiger plan/i);
  });

  it('returns 400 for invalid plan name', async () => {
    const res = await request(app)
      .post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'enterprise' });
    expect(res.status).toBe(400);
  });

  it('returns Stripe checkout URL for pro plan', async () => {
    const res = await request(app)
      .post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'pro' });
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://checkout.stripe.com/test');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_pro_test', quantity: 1 }],
        metadata: { userId: TEST_USER_ID },
      })
    );
  });

  it('returns 503 when price ID is not configured', async () => {
    const old = process.env.STRIPE_PRICE_BUSINESS;
    delete process.env.STRIPE_PRICE_BUSINESS;
    const res = await request(app)
      .post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'business' });
    expect(res.status).toBe(503);
    process.env.STRIPE_PRICE_BUSINESS = old;
  });
});
