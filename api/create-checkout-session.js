import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://vin-buyer-confidence.vercel.app';

const PLAN_MAP = {
  single: {
    mode: 'payment',
    price: process.env.STRIPE_PRICE_SINGLE || '',
    name: '1 Car Check'
  },
  bundle3: {
    mode: 'payment',
    price: process.env.STRIPE_PRICE_BUNDLE3 || '',
    name: '3 Car Compare Pack'
  },
  unlimited: {
    mode: 'subscription',
    price: process.env.STRIPE_PRICE_UNLIMITED || '',
    name: 'Unlimited Buyer Pass'
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ ok: false, error: 'Stripe is not configured' });
  }

  const { plan = 'single' } = req.body || {};
  const selected = PLAN_MAP[plan];
  if (!selected || !selected.price) {
    return res.status(400).json({ ok: false, error: 'Plan is not configured' });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: selected.mode,
      line_items: [{ price: selected.price, quantity: 1 }],
      success_url: `${APP_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(plan)}`,
      cancel_url: `${APP_BASE_URL}/cancel?plan=${encodeURIComponent(plan)}`,
      metadata: {
        plan,
        product_name: selected.name
      },
      allow_promotion_codes: true
    });

    return res.status(200).json({ ok: true, url: session.url, sessionId: session.id });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Unable to create checkout session' });
  }
}
