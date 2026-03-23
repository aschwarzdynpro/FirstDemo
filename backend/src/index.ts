import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import analysisRouter from './routes/analysis';
import documentsRouter from './routes/documents';
import userRouter from './routes/user';
import authRouter from './routes/auth';
import stripeRouter from './routes/stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Stripe webhook needs the raw body before express.json() parses it
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware — attaches userId to every request
app.use(authMiddleware);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/analyze', analysisRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/user', userRouter);
app.use('/api/stripe', stripeRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — catches multer errors (file too large, wrong type)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as { code?: string; message?: string; status?: number; statusCode?: number };

  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'Datei zu groß', message: 'Maximale Dateigröße: 50 MB (Pro) / 10 MB (Free).' });
    return;
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({ error: 'Unerwartetes Dateifeld.' });
    return;
  }

  const status = error.status ?? error.statusCode ?? 500;
  const message = error.message ?? 'Interner Serverfehler';
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`VertragsCheck AI Backend läuft auf Port ${PORT}`);
});

export default app;
