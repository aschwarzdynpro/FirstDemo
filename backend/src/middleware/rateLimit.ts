import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { checkUsageLimit, getUserUsage } from '../services/usageTracker';

export function freemiumLimit(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const userId = req.userId!;

  if (!checkUsageLimit(userId)) {
    const usage = getUserUsage(userId);
    res.status(429).json({
      error: 'Freemium-Limit erreicht',
      message: `Sie haben ${usage.used} von ${usage.limit} kostenlosen Analysen diesen Monat verwendet.`,
      usage,
    });
    return;
  }

  next();
}
