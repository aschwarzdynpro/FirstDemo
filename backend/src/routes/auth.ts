import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDb } from '../db/client';
import { ensureUserExists } from '../services/usageTracker';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '30d' }
  );
}

// Simple password hashing without bcrypt — SHA-256 + salt stored in DB
// (bcrypt would need native bindings; for MVP this is sufficient)
import { createHash, randomBytes } from 'crypto';

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(salt + password).digest('hex');
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  return hashPassword(password, salt) === hash;
}

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, password } = parsed.data;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' });
    return;
  }

  const userId = uuidv4();
  const salt = randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);

  db.prepare(`
    INSERT INTO users (id, email, plan, password_hash, password_salt)
    VALUES (?, ?, 'free', ?, ?)
  `).run(userId, email, passwordHash, salt);

  ensureUserExists(userId, email);

  const token = signToken(userId, email);
  res.status(201).json({ token, user: { id: userId, email, plan: 'free' } });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Eingabe.' });
    return;
  }

  const { email, password } = parsed.data;
  const db = getDb();

  const user = db.prepare(
    'SELECT id, email, plan, password_hash, password_salt FROM users WHERE email = ?'
  ).get(email) as { id: string; email: string; plan: string; password_hash: string; password_salt: string } | undefined;

  if (!user || !user.password_hash) {
    res.status(401).json({ error: 'E-Mail oder Passwort falsch.' });
    return;
  }

  if (!verifyPassword(password, user.password_salt, user.password_hash)) {
    res.status(401).json({ error: 'E-Mail oder Passwort falsch.' });
    return;
  }

  const token = signToken(user.id, user.email);
  res.json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht authentifiziert.' });
    return;
  }

  try {
    const decoded = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET || 'dev-secret'
    ) as { userId: string; email: string };

    const db = getDb();
    const user = db.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(decoded.userId) as
      | { id: string; email: string; plan: string }
      | undefined;

    if (!user) {
      res.status(401).json({ error: 'Benutzer nicht gefunden.' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Token ungültig oder abgelaufen.' });
  }
});

export default router;
