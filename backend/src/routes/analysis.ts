import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth';
import { freemiumLimit } from '../middleware/rateLimit';
import { extractTextFromFile } from '../services/pdfParser';
import { analyzeContractStreaming } from '../services/claude';
import { incrementUsage } from '../services/usageTracker';
import { getDb } from '../db/client';
import { StreamEvent } from '../types';

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const unique = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB hard limit (enforced per plan in route)
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Dateiformat nicht unterstützt. Erlaubt: PDF, DOCX, TXT'));
    }
  },
});

// POST /api/analyze
router.post(
  '/',
  freemiumLimit,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Keine Datei hochgeladen' });
      return;
    }

    // Free plan: max 10 MB
    const userId = req.userId!;
    const db = getDb();
    const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(userId) as { plan: string } | undefined;
    const plan = user?.plan || 'free';

    if (plan === 'free' && file.size > 10 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      res.status(413).json({
        error: 'Datei zu groß',
        message: 'Im Free-Plan sind maximal 10 MB erlaubt. Upgraden Sie auf Pro für bis zu 50 MB.',
      });
      return;
    }

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: StreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      sendEvent({ status: 'processing', progress: 5, message: 'Datei wird verarbeitet...' });

      const contractText = await extractTextFromFile(file.path, file.mimetype);

      sendEvent({ status: 'processing', progress: 10, message: 'Text extrahiert...' });

      const result = await analyzeContractStreaming(contractText, sendEvent);

      // Save to DB
      const analysisId = uuidv4();
      db.prepare(`
        INSERT INTO analyses (id, user_id, filename, file_size, overall_risk, result_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(analysisId, userId, file.originalname, file.size, result.overallRisk, JSON.stringify(result));

      incrementUsage(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      sendEvent({ status: 'error', message });
    } finally {
      fs.unlink(file.path, () => {});
      res.end();
    }
  }
);

export default router;
