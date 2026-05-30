import { spawnSync } from 'node:child_process';
import { PLAN_CATALOG } from '../lib/plans.js';

const PLAN_PRICE_ENV = Object.fromEntries(
  Object.values(PLAN_CATALOG).map(plan => [plan.priceEnv, `price_${plan.priceEnv.toLowerCase()}_placeholder`])
);

const REQUIRED_PAYMENT_ENV = {
  STRIPE_SECRET_KEY: 'sk_test_placeholder',
  ...PLAN_PRICE_ENV,
  STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
  APP_BASE_URL: 'https://example.test'
};

function runCheck(extraEnv = {}) {
  return spawnSync(process.execPath, ['scripts/check-readiness.mjs'], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      ...extraEnv
    },
    encoding: 'utf8'
  });
}

function parseOutput(result) {
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Readiness output was not valid JSON: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const missing = runCheck();
const missingBody = parseOutput(missing);
assert(missing.status === 1, 'Readiness should exit 1 when payment env is missing.');
assert(missingBody.ok === false, 'Missing-env readiness should return ok=false.');
assert(missingBody.payment.missing.includes('STRIPE_SECRET_KEY'), 'Missing-env readiness should list STRIPE_SECRET_KEY.');
for (const priceEnv of Object.keys(PLAN_PRICE_ENV)) {
  assert(missingBody.payment.missing.includes(priceEnv), `Missing-env readiness should list ${priceEnv}.`);
}

const invalid = runCheck({
  ...REQUIRED_PAYMENT_ENV,
  STRIPE_SECRET_KEY: 'placeholder',
  APP_BASE_URL: 'not-a-url'
});
const invalidBody = parseOutput(invalid);
assert(invalid.status === 1, 'Readiness should exit 1 when payment env has invalid formats.');
assert(invalidBody.ok === false, 'Invalid-format readiness should return ok=false.');
assert(invalidBody.payment.invalidFormat.includes('STRIPE_SECRET_KEY'), 'Invalid-format readiness should list STRIPE_SECRET_KEY.');
assert(invalidBody.payment.invalidFormat.includes('APP_BASE_URL'), 'Invalid-format readiness should list APP_BASE_URL.');

const invalidPriceEnv = Object.keys(PLAN_PRICE_ENV)[0];
const invalidPrice = runCheck({
  ...REQUIRED_PAYMENT_ENV,
  [invalidPriceEnv]: 'not-a-price-id'
});
const invalidPriceBody = parseOutput(invalidPrice);
assert(invalidPrice.status === 1, 'Readiness should exit 1 when a Stripe price env has an invalid format.');
assert(invalidPriceBody.ok === false, 'Invalid-price readiness should return ok=false.');
assert(invalidPriceBody.payment.invalidFormat.includes(invalidPriceEnv), `Invalid-price readiness should list ${invalidPriceEnv}.`);

const configured = runCheck(REQUIRED_PAYMENT_ENV);
const configuredBody = parseOutput(configured);
assert(configured.status === 0, 'Readiness should exit 0 when payment env is configured.');
assert(configuredBody.ok === true, 'Configured readiness should return ok=true.');
assert(configuredBody.payment.missing.length === 0, 'Configured readiness should have no missing payment env.');
assert(configuredBody.payment.invalidFormat.length === 0, 'Configured readiness should have no invalid payment env.');

const configuredLocalhost = runCheck({
  ...REQUIRED_PAYMENT_ENV,
  APP_BASE_URL: 'http://localhost:8787'
});
const configuredLocalhostBody = parseOutput(configuredLocalhost);
assert(configuredLocalhost.status === 0, 'Readiness should allow localhost app base URLs for local checkout testing.');
assert(configuredLocalhostBody.ok === true, 'Localhost readiness should return ok=true.');
assert(configuredLocalhostBody.payment.invalidFormat.length === 0, 'Localhost readiness should have no invalid payment env.');

const partialProvider = runCheck({
  ...REQUIRED_PAYMENT_ENV,
  VEHICLE_HISTORY_API_URL: 'https://provider.example/history'
});
const partialProviderBody = parseOutput(partialProvider);
assert(partialProvider.status === 0, 'Readiness should not fail paid traffic checks for partial optional provider config.');
assert(partialProviderBody.readyForLiveEvidence === false, 'Partial provider config should not count as live evidence readiness.');
assert(
  partialProviderBody.providers.partial.some(provider => provider.name === 'vehicleHistory' && provider.missing.includes('VEHICLE_HISTORY_API_KEY')),
  'Partial provider config should list the missing paired provider env.'
);
assert(
  partialProviderBody.evidenceNextAction === 'Complete missing URL/key pairs for partially configured vehicle-data providers.',
  'Partial provider config should report the provider setup next action.'
);

const invalidProviderUrl = runCheck({
  ...REQUIRED_PAYMENT_ENV,
  VEHICLE_HISTORY_API_URL: 'not-a-url',
  VEHICLE_HISTORY_API_KEY: 'provider_key_placeholder'
});
const invalidProviderUrlBody = parseOutput(invalidProviderUrl);
assert(invalidProviderUrl.status === 0, 'Readiness should not fail paid traffic checks for invalid optional provider config.');
assert(invalidProviderUrlBody.readyForLiveEvidence === false, 'Invalid provider URL should not count as live evidence readiness.');
assert(
  invalidProviderUrlBody.providers.invalidFormat.includes('VEHICLE_HISTORY_API_URL'),
  'Invalid provider URL should list the invalid provider env.'
);
assert(
  invalidProviderUrlBody.providers.partial.some(provider => provider.name === 'vehicleHistory' && provider.invalidFormat.includes('VEHICLE_HISTORY_API_URL')),
  'Invalid provider URL should keep the provider in partial setup details.'
);
assert(
  invalidProviderUrlBody.evidenceNextAction === 'Fix invalid vehicle-data provider URL formats before relying on live evidence.',
  'Invalid provider URL should report the provider URL fix next action.'
);

const whitespaceProviderUrl = runCheck({
  ...REQUIRED_PAYMENT_ENV,
  VEHICLE_HISTORY_API_URL: '   ',
  VEHICLE_HISTORY_API_KEY: 'provider_key_placeholder'
});
const whitespaceProviderUrlBody = parseOutput(whitespaceProviderUrl);
assert(whitespaceProviderUrl.status === 0, 'Readiness should not fail paid traffic checks for whitespace optional provider config.');
assert(whitespaceProviderUrlBody.readyForLiveEvidence === false, 'Whitespace provider URL should not count as live evidence readiness.');
assert(
  whitespaceProviderUrlBody.providers.configured.includes('VEHICLE_HISTORY_API_KEY'),
  'Whitespace provider URL should still show the paired provider key as configured.'
);
assert(
  whitespaceProviderUrlBody.providers.missing.includes('VEHICLE_HISTORY_API_URL'),
  'Whitespace provider URL should be treated as missing.'
);
assert(
  whitespaceProviderUrlBody.providers.partial.some(provider => provider.name === 'vehicleHistory' && provider.missing.includes('VEHICLE_HISTORY_API_URL')),
  'Whitespace provider URL should keep the provider in partial setup details.'
);
assert(
  whitespaceProviderUrlBody.providers.invalidFormat.length === 0,
  'Whitespace provider URL should not be reported as an invalid URL format.'
);

const configuredProvider = runCheck({
  ...REQUIRED_PAYMENT_ENV,
  VEHICLE_HISTORY_API_URL: 'https://provider.example/history',
  VEHICLE_HISTORY_API_KEY: 'provider_key_placeholder'
});
const configuredProviderBody = parseOutput(configuredProvider);
assert(configuredProvider.status === 0, 'Readiness should pass with configured payment and optional provider env.');
assert(configuredProviderBody.readyForLiveEvidence === true, 'Complete provider config should count as live evidence readiness.');
assert(configuredProviderBody.providers.ready.includes('vehicleHistory'), 'Complete provider config should list the ready provider.');
assert(
  configuredProviderBody.evidenceNextAction === 'Run a live vehicle-data provider smoke test in the deployment environment.',
  'Complete provider config should report the live evidence smoke-test next action.'
);

console.log(JSON.stringify({
  ok: true,
  checks: [
    'missing_payment_env_fails',
    'invalid_payment_env_fails',
    'invalid_price_env_fails',
    'configured_payment_env_passes',
    'configured_localhost_app_base_url_passes',
    'partial_provider_pair_not_live_ready',
    'invalid_provider_url_not_live_ready',
    'whitespace_provider_url_counts_missing',
    'configured_provider_pair_live_ready'
  ],
  configuredPaymentCount: configuredBody.payment.configuredCount
}, null, 2));
