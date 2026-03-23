/**
 * Sprint 1 — Tests für POST /api/analyze
 *
 * Claude API und pdfParser werden gemockt.
 * Die SSE-Streaming-Response wird als Text geparst.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createTestDb, signToken, JWT_SECRET } from './helpers';
import type { AnalysisResult } from '../src/types';

// ── Mocks ────────────────────────────────────────────────────────────────────

const testDb = createTestDb();
jest.mock('../src/db/client', () => ({ getDb: () => testDb, default: () => testDb }));

jest.mock('../src/services/pdfParser', () => ({
  extractTextFromFile: jest.fn<() => Promise<string>>().mockResolvedValue('Mustervertragstext für die Analyse.'),
  countPages: jest.fn<(t: string) => number>().mockReturnValue(1),
}));

const MOCK_RESULT: AnalysisResult = {
  summary: 'Ein einfacher Testvertrag.',
  overallRisk: 'low',
  clauses: [
    {
      id: 'c1',
      title: 'Laufzeit',
      originalText: '12 Monate.',
      plainExplanation: 'Vertrag läuft ein Jahr.',
      risk: 'low',
      riskReason: 'Standard.',
    },
  ],
  recommendations: ['Klausel prüfen.'],
};

jest.mock('../src/services/claude', () => ({
  analyzeContractStreaming: jest.fn(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (_text: string, sendEvent: (e: any) => void): Promise<AnalysisResult> => {
      sendEvent({ status: 'processing', progress: 50, message: 'Analysiere...' });
      sendEvent({ status: 'complete', progress: 100, result: MOCK_RESULT });
      return MOCK_RESULT;
    }
  ),
}));

process.env.JWT_SECRET = JWT_SECRET;

// ── App setup ─────────────────────────────────────────────────────────────────

import analysisRouter from '../src/routes/analysis';
import { authMiddleware } from '../src/middleware/auth';

const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use('/api/analyze', analysisRouter);

// ── Test users ────────────────────────────────────────────────────────────────

const FREE_USER = 'analysis-free';
const PRO_USER  = 'analysis-pro';

testDb.prepare(`INSERT OR IGNORE INTO users (id, email, plan) VALUES (?, ?, 'free')`).run(FREE_USER, 'af@test.com');
testDb.prepare(`INSERT OR IGNORE INTO users (id, email, plan) VALUES (?, ?, 'pro')`).run(PRO_USER, 'ap@test.com');

// ── Helpers ───────────────────────────────────────────────────────────────────

function writeTmpTxt(content = 'Vertragstext'): string {
  const p = path.join(os.tmpdir(), `vc-analysis-test-${Date.now()}.txt`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

/** Parse SSE stream body into an array of event objects. */
function parseSseEvents(body: string): Array<Record<string, unknown>> {
  return body
    .split('\n')
    .filter((l) => l.startsWith('data: '))
    .map((l) => JSON.parse(l.slice(6)) as Record<string, unknown>);
}

afterEach(() => {
  testDb.prepare('DELETE FROM usage WHERE user_id IN (?, ?)').run(FREE_USER, PRO_USER);
  testDb.prepare('DELETE FROM analyses WHERE user_id IN (?, ?)').run(FREE_USER, PRO_USER);
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/analyze', () => {
  it('returns 400 when no file is attached', async () => {
    const token = signToken(FREE_USER);
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/keine datei/i);
  });

  it('returns 413 when free user uploads file > 10 MB', async () => {
    // Write a file slightly over 10 MB
    const bigFile = path.join(os.tmpdir(), 'vc-big.txt');
    const oneMb = Buffer.alloc(1024 * 1024, 'a');
    const handle = fs.openSync(bigFile, 'w');
    for (let i = 0; i < 11; i++) fs.writeSync(handle, oneMb);
    fs.closeSync(handle);

    const token = signToken(FREE_USER);
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', bigFile, { filename: 'big.txt', contentType: 'text/plain' });
    expect(res.status).toBe(413);
    fs.unlinkSync(bigFile);
  });

  it('returns 429 when free user exceeds monthly limit', async () => {
    // Exhaust the free limit
    testDb.prepare(`
      INSERT INTO usage (user_id, month, analysis_count) VALUES (?, strftime('%Y-%m', 'now'), 3)
      ON CONFLICT(user_id, month) DO UPDATE SET analysis_count = 3
    `).run(FREE_USER);

    const token = signToken(FREE_USER);
    const tmpFile = writeTmpTxt();
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', tmpFile, { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(429);
    fs.unlinkSync(tmpFile);
  });

  it('streams SSE events and saves result to DB for pro user', async () => {
    const token = signToken(PRO_USER);
    const tmpFile = writeTmpTxt();

    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', tmpFile, { filename: 'vertrag.txt', contentType: 'text/plain' })
      .buffer(true)
      .parse((res, cb) => {
        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk.toString()));
        res.on('end', () => cb(null, data));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);

    const events = parseSseEvents(res.body as string);
    expect(events.some((e) => e.status === 'processing')).toBe(true);
    expect(events.some((e) => e.status === 'complete')).toBe(true);

    const completeEvent = events.find((e) => e.status === 'complete');
    expect((completeEvent?.result as AnalysisResult)?.overallRisk).toBe('low');

    // Verify the analysis was persisted
    const saved = testDb
      .prepare('SELECT * FROM analyses WHERE user_id = ?')
      .get(PRO_USER) as { overall_risk: string } | undefined;
    expect(saved?.overall_risk).toBe('low');

    fs.unlinkSync(tmpFile);
  });
});
