import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../db/client';
import { streamAnalysisPdf } from '../services/pdfExport';
import type { AnalysisResult } from '../types';

const router = Router();

// GET /api/documents
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const userId = req.userId!;

  const rows = db
    .prepare(`
      SELECT id, filename, created_at as uploadedAt, overall_risk as overallRisk, result_json
      FROM analyses
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    .all(userId) as Array<{
    id: string;
    filename: string;
    uploadedAt: string;
    overallRisk: string;
    result_json: string;
  }>;

  const documents = rows.map((row) => {
    const result = JSON.parse(row.result_json || '{}');
    return {
      id: row.id,
      filename: row.filename,
      uploadedAt: row.uploadedAt,
      overallRisk: row.overallRisk,
      summary: result.summary || '',
    };
  });

  res.json({ documents });
});

// DELETE /api/documents/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const userId = req.userId!;
  const { id } = req.params;

  const result = db
    .prepare('DELETE FROM analyses WHERE id = ? AND user_id = ?')
    .run(id, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Dokument nicht gefunden' });
    return;
  }

  res.json({ success: true });
});

// GET /api/documents/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const userId = req.userId!;
  const { id } = req.params;

  const row = db
    .prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?')
    .get(id, userId) as { result_json: string; filename: string; created_at: string; overall_risk: string } | undefined;

  if (!row) {
    res.status(404).json({ error: 'Dokument nicht gefunden' });
    return;
  }

  res.json({
    id,
    filename: row.filename,
    uploadedAt: row.created_at,
    overallRisk: row.overall_risk,
    result: JSON.parse(row.result_json),
  });
});

// GET /api/documents/:id/export  (Pro only — PDF download)
router.get('/:id/export', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const userId = req.userId!;
  const { id } = req.params;

  const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(userId) as { plan: string } | undefined;
  if (user?.plan === 'free') {
    res.status(403).json({ error: 'PDF-Export ist ein Pro-Feature. Bitte upgraden.' });
    return;
  }

  const row = db
    .prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?')
    .get(id, userId) as { result_json: string; filename: string } | undefined;

  if (!row) {
    res.status(404).json({ error: 'Dokument nicht gefunden' });
    return;
  }

  const result: AnalysisResult = JSON.parse(row.result_json);
  streamAnalysisPdf(res, row.filename, result);
});

export default router;
