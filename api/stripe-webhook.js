import Stripe from 'stripe';
import { savePurchase } from '../lib/purchase-state.js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function getPlanAccess(plan) {
  if (plan === 'single') return { plan, checks: 1, subscription: false };
  if (plan === 'bundle3') return { plan, checks: 3, subscription: false };
  if (plan === 'unlimited') return { plan, checks: null, subscription: true };
  return { plan: 'unknown', checks: 0, subscription: false };
}

export const config = {
  api: {
    bodyParser: false
  }
};

async function readBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ ok: false, error: 'Stripe webhook is not configured' });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const rawBody = await readBuffer(req);
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const plan = session.metadata?.plan || 'unknown';
      const entitlement = getPlanAccess(plan);

      const saved = savePurchase({
        sessionId: session.id,
        customerEmail: session.customer_details?.email || null,
        customerId: session.customer || null,
        plan,
        entitlement,
        paymentStatus: session.payment_status || null
      });

      console.log(JSON.stringify({
        type: 'checkout.session.completed',
        sessionId: session.id,
        customerEmail: session.customer_details?.email || null,
        customerId: session.customer || null,
        plan,
        entitlement,
        saved
      }));
    }

    return res.status(200).json({ ok: true, received: true });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message || 'Webhook handling failed' });
  }
}
