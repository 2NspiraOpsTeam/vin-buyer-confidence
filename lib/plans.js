export const PLAN_CATALOG = {
  single: {
    mode: 'payment',
    priceEnv: 'STRIPE_PRICE_SINGLE',
    name: '1 Car Check',
    checks: 1,
    subscription: false
  },
  bundle3: {
    mode: 'payment',
    priceEnv: 'STRIPE_PRICE_BUNDLE3',
    name: '3 Car Compare Pack',
    checks: 3,
    subscription: false
  },
  unlimited: {
    mode: 'subscription',
    priceEnv: 'STRIPE_PRICE_UNLIMITED',
    name: 'Unlimited Buyer Pass',
    checks: null,
    subscription: true
  }
};

export function normalizePlanKey(plan) {
  return String(plan || 'unknown').trim().toLowerCase();
}

export function getPlanDefinition(plan) {
  return PLAN_CATALOG[normalizePlanKey(plan)] || null;
}

export function getPlanAccess(plan) {
  const normalizedPlan = normalizePlanKey(plan);
  const definition = getPlanDefinition(normalizedPlan);
  if (!definition) {
    return { plan: 'unknown', checks: 0, subscription: false };
  }

  return {
    plan: normalizedPlan,
    checks: definition.checks,
    subscription: definition.subscription
  };
}

export function shouldFulfillPlan(plan) {
  return Boolean(getPlanDefinition(plan));
}
