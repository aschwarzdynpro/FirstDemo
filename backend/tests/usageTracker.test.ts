/**
 * Sprint 1 — Tests für den UsageTracker Service
 * Testet Freemium-Limits, Zähler-Logik und Plan-Grenzen.
 */
import { jest } from '@jest/globals';
import { createTestDb, JWT_SECRET } from './helpers';

const testDb = createTestDb();
jest.mock('../src/db/client', () => ({ getDb: () => testDb, default: () => testDb }));
process.env.JWT_SECRET = JWT_SECRET;

import {
  getUserUsage,
  checkUsageLimit,
  incrementUsage,
  ensureUserExists,
} from '../src/services/usageTracker';

// Feste Nutzer-IDs für diese Suite
const FREE_USER     = 'tracker-free';
const PRO_USER      = 'tracker-pro';
const BUSINESS_USER = 'tracker-biz';

beforeAll(() => {
  testDb.prepare(`INSERT OR IGNORE INTO users (id, email, plan) VALUES (?, ?, 'free')`).run(FREE_USER, 'free@tracker.test');
  testDb.prepare(`INSERT OR IGNORE INTO users (id, email, plan) VALUES (?, ?, 'pro')`).run(PRO_USER, 'pro@tracker.test');
  testDb.prepare(`INSERT OR IGNORE INTO users (id, email, plan) VALUES (?, ?, 'business')`).run(BUSINESS_USER, 'biz@tracker.test');
});

afterEach(() => {
  // Reset usage counts between tests
  testDb.prepare('DELETE FROM usage WHERE user_id IN (?, ?, ?)').run(FREE_USER, PRO_USER, BUSINESS_USER);
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ensureUserExists', () => {
  it('creates a new user if not present', () => {
    const newId = 'tracker-new-user';
    ensureUserExists(newId, 'new@tracker.test');
    const row = testDb.prepare('SELECT id, plan FROM users WHERE id = ?').get(newId) as { id: string; plan: string };
    expect(row).toBeDefined();
    expect(row.plan).toBe('free');
  });

  it('is idempotent — does not throw on second call', () => {
    expect(() => {
      ensureUserExists(FREE_USER, 'free@tracker.test');
      ensureUserExists(FREE_USER, 'free@tracker.test');
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getUserUsage', () => {
  it('returns 0 used for a fresh free user', () => {
    const usage = getUserUsage(FREE_USER);
    expect(usage.used).toBe(0);
    expect(usage.limit).toBe(3);
    expect(usage.plan).toBe('free');
  });

  it('returns -1 limit for pro plan (unlimited)', () => {
    const usage = getUserUsage(PRO_USER);
    expect(usage.limit).toBe(-1);
    expect(usage.plan).toBe('pro');
  });

  it('returns -1 limit for business plan (unlimited)', () => {
    const usage = getUserUsage(BUSINESS_USER);
    expect(usage.limit).toBe(-1);
    expect(usage.plan).toBe('business');
  });

  it('reflects incremented count', () => {
    incrementUsage(FREE_USER);
    incrementUsage(FREE_USER);
    const usage = getUserUsage(FREE_USER);
    expect(usage.used).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('checkUsageLimit', () => {
  it('allows free user with 0 analyses', () => {
    expect(checkUsageLimit(FREE_USER)).toBe(true);
  });

  it('allows free user with 2 analyses (below limit)', () => {
    incrementUsage(FREE_USER);
    incrementUsage(FREE_USER);
    expect(checkUsageLimit(FREE_USER)).toBe(true);
  });

  it('blocks free user after 3 analyses', () => {
    incrementUsage(FREE_USER);
    incrementUsage(FREE_USER);
    incrementUsage(FREE_USER);
    expect(checkUsageLimit(FREE_USER)).toBe(false);
  });

  it('always allows pro user regardless of count', () => {
    for (let i = 0; i < 10; i++) incrementUsage(PRO_USER);
    expect(checkUsageLimit(PRO_USER)).toBe(true);
  });

  it('always allows business user regardless of count', () => {
    for (let i = 0; i < 10; i++) incrementUsage(BUSINESS_USER);
    expect(checkUsageLimit(BUSINESS_USER)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('incrementUsage', () => {
  it('increments count on first call', () => {
    incrementUsage(FREE_USER);
    const { used } = getUserUsage(FREE_USER);
    expect(used).toBe(1);
  });

  it('increments count cumulatively', () => {
    incrementUsage(FREE_USER);
    incrementUsage(FREE_USER);
    incrementUsage(FREE_USER);
    const { used } = getUserUsage(FREE_USER);
    expect(used).toBe(3);
  });
});
