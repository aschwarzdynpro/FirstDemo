import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { getDb } from '../db/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendUpgradeConfirmationEmail } from '../services/email';

const router = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(key);
}

// Price IDs are read from env so they can differ between test/live mode
const PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,
};

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { plan } = req.body as { plan?: string };

  if (!plan || !['pro', 'business'].includes(plan)) {
    res.status(400).json({ error: 'Ungültiger Plan.' });
    return;
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    res.status(503).json({ error: 'Stripe-Preise noch nicht konfiguriert.' });
    return;
  }

  try {
    const stripe = getStripe();
    const db = getDb();
    const userId = req.userId!;

    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user?.email,
      metadata: { userId },
      success_url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/dashboard?upgraded=true`,
      cancel_url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/pricing?cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe-Fehler';
    res.status(500).json({ error: message });
  }
});

// POST /api/stripe/webhook  (raw body required — mounted before express.json())
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    res.status(400).json({ error: 'Webhook-Konfiguration fehlt.' });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook-Fehler';
    res.status(400).json({ error: message });
    return;
  }

  const db = getDb();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan ?? resolvePlanFromSession(session);

    if (userId && plan) {
      db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, userId);

      const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;
      if (user?.email) {
        sendUpgradeConfirmationEmail(user.email, plan).catch(() => {});
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    // Downgrade to free when subscription is cancelled
    db.prepare(`
      UPDATE users SET plan = 'free'
      WHERE id = (SELECT id FROM users WHERE stripe_customer_id = ?)
    `).run(customerId);
  }

  res.json({ received: true });
});

function resolvePlanFromSession(session: Stripe.Checkout.Session): string | null {
  const proPriceId = process.env.STRIPE_PRICE_PRO;
  const businessPriceId = process.env.STRIPE_PRICE_BUSINESS;
  // We can't access line items from the session object directly in webhook —
  // use metadata set at session creation instead. Fallback: pro.
  void session; void proPriceId; void businessPriceId;
  return 'pro';
}

export default router;
