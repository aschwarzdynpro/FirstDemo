import { getDb } from '../db/client';
import { UserUsage } from '../types';

const FREE_LIMIT = 3;
const PRO_LIMIT = Infinity;
const BUSINESS_LIMIT = Infinity;

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPlanLimit(plan: string): number {
  switch (plan) {
    case 'pro':
      return PRO_LIMIT;
    case 'business':
      return BUSINESS_LIMIT;
    default:
      return FREE_LIMIT;
  }
}

export function getUserUsage(userId: string): UserUsage {
  const db = getDb();
  const month = getCurrentMonth();

  const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(userId) as { plan: string } | undefined;
  const plan = (user?.plan || 'free') as 'free' | 'pro' | 'business';

  const usage = db
    .prepare('SELECT analysis_count FROM usage WHERE user_id = ? AND month = ?')
    .get(userId, month) as { analysis_count: number } | undefined;

  const used = usage?.analysis_count || 0;
  const limit = getPlanLimit(plan);

  return { used, limit: limit === Infinity ? -1 : limit, plan };
}

export function checkUsageLimit(userId: string): boolean {
  const { used, limit, plan } = getUserUsage(userId);
  if (plan === 'pro' || plan === 'business') return true;
  return used < limit;
}

export function incrementUsage(userId: string): void {
  const db = getDb();
  const month = getCurrentMonth();

  db.prepare(`
    INSERT INTO usage (user_id, month, analysis_count)
    VALUES (?, ?, 1)
    ON CONFLICT(user_id, month) DO UPDATE SET analysis_count = analysis_count + 1
  `).run(userId, month);
}

export function ensureUserExists(userId: string, email?: string): void {
  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, plan)
    VALUES (?, ?, 'free')
  `).run(userId, email || null);
}
