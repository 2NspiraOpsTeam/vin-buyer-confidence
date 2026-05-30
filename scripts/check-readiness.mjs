import { isValidAppBaseUrl } from '../lib/env-validation.js';
import { PLAN_CATALOG } from '../lib/plans.js';
import { getProviderReadiness, PROVIDER_CONFIGS } from '../lib/provider-readiness.js';

const PLAN_PRICE_ENV = Object.values(PLAN_CATALOG).map(plan => plan.priceEnv);

const REQUIRED_PAYMENT_ENV = [
  'STRIPE_SECRET_KEY',
  ...PLAN_PRICE_ENV,
  'STRIPE_WEBHOOK_SECRET',
  'APP_BASE_URL'
];

const OPTIONAL_PROVIDER_ENV = [
  'MARKETCHECK_API_KEY',
  'AUTODEV_API_KEY',
  'VEHICLE_HISTORY_API_URL',
  'VEHICLE_HISTORY_API_KEY',
  'AUCTION_EVIDENCE_API_URL',
  'AUCTION_EVIDENCE_API_KEY'
];

const PAYMENT_FORMAT_RULES = {
  STRIPE_SECRET_KEY: value => /^sk_(test|live)_/.test(value),
  ...Object.fromEntries(PLAN_PRICE_ENV.map(name => [name, value => value.startsWith('price_')])),
  STRIPE_WEBHOOK_SECRET: value => value.startsWith('whsec_'),
  APP_BASE_URL: isValidAppBaseUrl
};

function present(name) {
  return typeof process.env[name] === 'string' && process.env[name].trim().length > 0;
}

function summarize(names) {
  const configured = names.filter(present);
  const missing = names.filter(name => !present(name));
  return { configured, missing };
}

function invalidPaymentEnv(names) {
  return names.filter(name => {
    const value = process.env[name];
    const rule = PAYMENT_FORMAT_RULES[name];
    return value && rule && !rule(value);
  });
}

const payment = summarize(REQUIRED_PAYMENT_ENV);
const providers = summarize(OPTIONAL_PROVIDER_ENV);
const providerConfigs = getProviderReadiness(PROVIDER_CONFIGS);
const invalidPayment = invalidPaymentEnv(REQUIRED_PAYMENT_ENV);
const invalidProvider = providerConfigs.partial.flatMap(provider => provider.invalidFormat || []);
const readyForPaidTraffic = payment.missing.length === 0 && invalidPayment.length === 0;
const readyForLiveEvidence = providerConfigs.ready.length > 0;
const evidenceNextAction = invalidProvider.length
  ? 'Fix invalid vehicle-data provider URL formats before relying on live evidence.'
  : providerConfigs.partial.length
  ? 'Complete missing URL/key pairs for partially configured vehicle-data providers.'
  : readyForLiveEvidence
    ? 'Run a live vehicle-data provider smoke test in the deployment environment.'
    : 'Set optional vehicle-data provider credentials before relying on live evidence.';

console.log(JSON.stringify({
  ok: readyForPaidTraffic,
  readyForPaidTraffic,
  readyForLiveEvidence,
  payment: {
    configuredCount: payment.configured.length,
    missing: payment.missing,
    invalidFormat: invalidPayment
  },
  providers: {
    configured: providers.configured,
    missing: providers.missing,
    invalidFormat: invalidProvider,
    ready: providerConfigs.ready,
    partial: providerConfigs.partial
  },
  evidenceNextAction,
  nextAction: readyForPaidTraffic
    ? 'Run a live Stripe checkout smoke test in the deployment environment.'
    : invalidPayment.length
      ? 'Fix invalid Stripe/payment environment variable formats before sending paid traffic.'
      : 'Set the missing Stripe environment variables before sending paid traffic.'
}, null, 2));

if (!readyForPaidTraffic) {
  process.exitCode = 1;
}
