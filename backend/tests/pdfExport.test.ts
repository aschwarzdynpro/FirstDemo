/**
 * Tests for GET /api/documents/:id/export
 */
import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import { createTestDb, signToken, JWT_SECRET } from './helpers';

// ── Mock DB ──────────────────────────────────────────────────────────────────
const testDb = createTestDb();

const PRO_USER   = 'user-pro-export';
const FREE_USER  = 'user-free-export';
const DOC_ID     = 'doc-export-001';

testDb.prepare(`INSERT INTO users (id, email, plan) VALUES (?, ?, 'pro')`).run(PRO_USER, 'pro@test.com');
testDb.prepare(`INSERT INTO users (id, email, plan) VALUES (?, ?, 'free')`).run(FREE_USER, 'free@test.com');
testDb.prepare(`
  INSERT INTO analyses (id, user_id, filename, overall_risk, result_json)
  VALUES (?, ?, ?, ?, ?)
`).run(
  DOC_ID, PRO_USER, 'mietvertrag.pdf', 'medium',
  JSON.stringify({
    summary: 'Standard-Mietvertrag.',
    overallRisk: 'medium',
    clauses: [
      {
        id: 'c1',
        title: 'Kaution',
        originalText: 'Kaution beträgt 3 Monatsmieten.',
        plainExplanation: 'Sie zahlen 3 Monatsmieten als Sicherheit.',
        risk: 'medium',
        riskReason: 'Maximal zulässig, aber üblich.',
        suggestion: 'Auf 2 Monatsmieten verhandeln.',
      },
    ],
    recommendations: ['Klausel 3 prüfen lassen.'],
  })
);

jest.mock('../src/db/client', () => ({ getDb: () => testDb }));

process.env.JWT_SECRET = JWT_SECRET;

import documentsRouter from '../src/routes/documents';
import { authMiddleware } from '../src/middleware/auth';

const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use('/api/documents', documentsRouter);

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/documents/:id/export', () => {
  it('returns 403 for free-plan user', async () => {
    const token = signToken(FREE_USER, 'free@test.com');
    const res = await request(app)
      .get(`/api/documents/${DOC_ID}/export`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/pro-feature/i);
  });

  it('returns 404 when document does not belong to user', async () => {
    // Free user tries to access a doc that is not theirs
    const token = signToken(FREE_USER, 'free@test.com');
    // Temporarily upgrade free user so the plan check passes
    testDb.prepare('UPDATE users SET plan = ? WHERE id = ?').run('pro', FREE_USER);

    const res = await request(app)
      .get(`/api/documents/${DOC_ID}/export`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);

    testDb.prepare('UPDATE users SET plan = ? WHERE id = ?').run('free', FREE_USER);
  });

  it('returns a PDF for pro user with own document', async () => {
    const token = signToken(PRO_USER, 'pro@test.com');
    const res = await request(app)
      .get(`/api/documents/${DOC_ID}/export`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    // PDF magic bytes
    const body = res.body as Buffer;
    expect(body.slice(0, 4).toString()).toBe('%PDF');
  });
});
