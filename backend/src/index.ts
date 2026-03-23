import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import analysisRouter from './routes/analysis';
import documentsRouter from './routes/documents';
import userRouter from './routes/user';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware — attaches userId to every request
app.use(authMiddleware);

// Routes (auth before global authMiddleware so login/register don't require a token)
app.use('/api/auth', authRouter);
app.use('/api/analyze', analysisRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/user', userRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`VertragsCheck AI Backend läuft auf Port ${PORT}`);
});

export default app;
