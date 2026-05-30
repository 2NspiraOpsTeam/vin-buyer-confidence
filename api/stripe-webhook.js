import Stripe from 'stripe';
import { getPlanAccess, normalizePlanKey, shouldFulfillPlan } from '../lib/plans.js';
import { savePurchase } from '../lib/purchase-state.js';

export { getPlanAccess, normalizePlanKey, shouldFulfillPlan };

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

function getEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const stripeSecretKey = getEnv('STRIPE_SECRET_KEY');
  const stripeWebhookSecret = getEnv('STRIPE_WEBHOOK_SECRET');
  if (!stripeSecretKey || !stripeWebhookSecret) {
    return res.status(500).json({ ok: false, error: 'Stripe webhook is not configured' });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const rawBody = await readBuffer(req);
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const plan = normalizePlanKey(session.metadata?.plan);
      const entitlement = getPlanAccess(plan);
      if (!shouldFulfillPlan(plan)) {
        console.warn(JSON.stringify({
          type: 'checkout.session.completed',
          sessionId: session.id,
          plan,
          skipped: 'unknown_plan'
        }));
        return res.status(200).json({ ok: true, received: true, fulfilled: false });
      }

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
