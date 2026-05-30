import Stripe from 'stripe';
import { isValidAppBaseUrl } from '../lib/env-validation.js';
import { getPlanDefinition, normalizePlanKey } from '../lib/plans.js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const APP_BASE_URL = process.env.APP_BASE_URL;

export function buildCheckoutRedirectUrls(appBaseUrl, plan) {
  const encodedPlan = encodeURIComponent(normalizePlanKey(plan));
  return {
    successUrl: `${appBaseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}&plan=${encodedPlan}`,
    cancelUrl: `${appBaseUrl}/cancel.html?plan=${encodedPlan}`
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const rawPlan = req.body?.plan || 'single';
  const plan = normalizePlanKey(rawPlan);
  const selected = getPlanDefinition(plan);
  const price = selected ? process.env[selected.priceEnv] || '' : '';
  if (!selected || !price) {
    return res.status(400).json({ ok: false, error: 'Plan is not configured' });
  }

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ ok: false, error: 'Stripe is not configured' });
  }

  if (!APP_BASE_URL) {
    return res.status(500).json({ ok: false, error: 'App base URL is not configured' });
  }

  if (!isValidAppBaseUrl(APP_BASE_URL)) {
    return res.status(500).json({ ok: false, error: 'App base URL is invalid' });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const { successUrl, cancelUrl } = buildCheckoutRedirectUrls(APP_BASE_URL, plan);
    const session = await stripe.checkout.sessions.create({
      mode: selected.mode,
      line_items: [{ price, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
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
