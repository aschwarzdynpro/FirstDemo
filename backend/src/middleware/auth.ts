import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ensureUserExists } from '../services/usageTracker';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { userId: string; email?: string };
      req.userId = decoded.userId;
      ensureUserExists(decoded.userId, decoded.email);
      return next();
    } catch {
      // Fall through to guest user
    }
  }

  // Guest/anonymous user — use IP-based or session-based ID
  const guestId = `guest_${req.ip?.replace(/[.:]/g, '_') || 'unknown'}`;
  req.userId = guestId;
  ensureUserExists(guestId);
  next();
}
