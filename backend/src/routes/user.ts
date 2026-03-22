import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getUserUsage } from '../services/usageTracker';

const router = Router();

// GET /api/user/usage
router.get('/usage', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const usage = getUserUsage(userId);
  res.json(usage);
});

export default router;
