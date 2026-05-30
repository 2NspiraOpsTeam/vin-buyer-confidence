import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import checkoutHandler, { buildCheckoutRedirectUrls } from '../api/create-checkout-session.js';
import decodeHandler from '../api/decode.js';
import historyHandler from '../api/history.js';
import recallsHandler from '../api/recalls.js';
import sessionStatusHandler from '../api/session-status.js';
import stripeWebhookHandler, { getPlanAccess, shouldFulfillPlan } from '../api/stripe-webhook.js';
import dashboardHandler from '../api/vehicle-dashboard.js';
import { PLAN_CATALOG } from '../lib/plans.js';
import { savePurchase } from '../lib/purchase-state.js';

const originalFetch = globalThis.fetch;

globalThis.fetch = async url => {
  const target = String(url);
  if (target.includes('vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues')) {
    return Response.json({
      Results: [
        {
          VIN: 'WBAJA7C57JWA72863',
          ModelYear: '2018',
          Make: 'BMW',
          Model: '530i',
          Trim: 'xDrive',
          ErrorCode: '0',
          ErrorText: '0 - VIN decoded clean. Check Digit (9th position) is correct',
          BodyClass: 'Sedan/Saloon',
          VehicleType: 'PASSENGER CAR',
          DriveType: 'AWD/All-Wheel Drive',
          EngineCylinders: '4',
          DisplacementL: '2.0',
          FuelTypePrimary: 'Gasoline',
          PlantCountry: 'AUSTRIA',
          Manufacturer: 'BMW AG',
          BasePrice: '52650.00',
          ABS: 'Standard',
          AirBagLocFront: '1st Row (Driver and Passenger)',
          AirBagLocSide: '1st Row (Driver and Passenger)',
          AirBagLocCurtain: '1st and 2nd Rows'
        }
      ]
    });
  }

  if (target.includes('api.nhtsa.gov/recalls/recallsByVehicle')) {
    return Response.json({ results: [] });
  }

  return originalFetch(url);
};

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

async function callHandler(handler, req) {
  const res = createResponse();
  await handler(req, res);
  return res;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runConfiguredCheckoutPlanCheck() {
  const script = `
    import checkoutHandler from './api/create-checkout-session.js';
    const res = {
      statusCode: 200,
      body: undefined,
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };
    await checkoutHandler({ method: 'POST', body: { plan: 'not-real' } }, res);
    console.log(JSON.stringify({ statusCode: res.statusCode, body: res.body }));
  `;

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      STRIPE_SECRET_KEY: 'sk_test_placeholder'
    },
    encoding: 'utf8'
  });

  assert(result.status === 0, `Configured checkout plan check failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

function runConfiguredCheckoutNormalizedPlanCheck() {
  const script = `
    import checkoutHandler from './api/create-checkout-session.js';
    const res = {
      statusCode: 200,
      body: undefined,
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };
    await checkoutHandler({ method: 'POST', body: { plan: ' Single ' } }, res);
    console.log(JSON.stringify({ statusCode: res.statusCode, body: res.body }));
  `;

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      STRIPE_PRICE_SINGLE: 'price_single_placeholder'
    },
    encoding: 'utf8'
  });

  assert(result.status === 0, `Configured checkout normalized-plan check failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

function runConfiguredCheckoutCatalogPlanCheck(planKey, priceEnv) {
  const script = `
    import checkoutHandler from './api/create-checkout-session.js';
    const res = {
      statusCode: 200,
      body: undefined,
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };
    await checkoutHandler({ method: 'POST', body: { plan: ${JSON.stringify(planKey)} } }, res);
    console.log(JSON.stringify({ statusCode: res.statusCode, body: res.body }));
  `;

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      [priceEnv]: `price_${planKey}_placeholder`
    },
    encoding: 'utf8'
  });

  assert(result.status === 0, `Configured checkout ${planKey} check failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

function runMissingAppBaseUrlWithStripeCheck() {
  const script = `
    import checkoutHandler from './api/create-checkout-session.js';
    const res = {
      statusCode: 200,
      body: undefined,
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };
    await checkoutHandler({ method: 'POST', body: { plan: 'single' } }, res);
    console.log(JSON.stringify({ statusCode: res.statusCode, body: res.body }));
  `;

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      STRIPE_PRICE_SINGLE: 'price_single_placeholder'
    },
    encoding: 'utf8'
  });

  assert(result.status === 0, `Missing app base URL checkout check failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

function runInvalidAppBaseUrlWithStripeCheck() {
  const script = `
    import checkoutHandler from './api/create-checkout-session.js';
    const res = {
      statusCode: 200,
      body: undefined,
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };
    await checkoutHandler({ method: 'POST', body: { plan: 'single' } }, res);
    console.log(JSON.stringify({ statusCode: res.statusCode, body: res.body }));
  `;

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      STRIPE_PRICE_SINGLE: 'price_single_placeholder',
      APP_BASE_URL: 'not-a-url'
    },
    encoding: 'utf8'
  });

  assert(result.status === 0, `Invalid app base URL checkout check failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

function runMissingStripeWithConfiguredPriceCheck() {
  const script = `
    import checkoutHandler from './api/create-checkout-session.js';
    const res = {
      statusCode: 200,
      body: undefined,
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; }
    };
    await checkoutHandler({ method: 'POST', body: { plan: 'single' } }, res);
    console.log(JSON.stringify({ statusCode: res.statusCode, body: res.body }));
  `;

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      STRIPE_PRICE_SINGLE: 'price_single_placeholder'
    },
    encoding: 'utf8'
  });

  assert(result.status === 0, `Missing Stripe checkout check failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const checkout = await callHandler(checkoutHandler, {
  method: 'POST',
  body: { plan: 'single' }
});
assert(checkout.statusCode === 400, 'Checkout should fail safely without configured price env.');
assert(checkout.body?.error === 'Plan is not configured', 'Checkout should report missing plan price config.');

const checkoutMissingStripe = runMissingStripeWithConfiguredPriceCheck();
assert(checkoutMissingStripe.statusCode === 500, 'Checkout should fail safely without Stripe secret when price env is configured.');
assert(checkoutMissingStripe.body?.error === 'Stripe is not configured', 'Checkout should report missing Stripe secret after plan config passes.');

const checkoutWrongMethod = await callHandler(checkoutHandler, {
  method: 'GET',
  body: {}
});
assert(checkoutWrongMethod.statusCode === 405, 'Checkout should reject non-POST requests.');
assert(checkoutWrongMethod.headers.Allow === 'POST', 'Checkout should return Allow: POST for wrong method.');

const checkoutMissingPrice = await callHandler(checkoutHandler, {
  method: 'POST',
  body: { plan: 'not-real' }
});
assert(checkoutMissingPrice.statusCode === 400, 'Checkout should reject unconfigured plans before Stripe config checks.');
assert(checkoutMissingPrice.body?.error === 'Plan is not configured', 'Checkout should report unconfigured plans without requiring Stripe env.');

const configuredCheckoutMissingPrice = runConfiguredCheckoutPlanCheck();
assert(configuredCheckoutMissingPrice.statusCode === 400, 'Checkout should reject unconfigured plans when Stripe env is present.');
assert(configuredCheckoutMissingPrice.body?.error === 'Plan is not configured', 'Checkout should report unconfigured plan when Stripe env is present.');

const configuredCheckoutNormalizedPlan = runConfiguredCheckoutNormalizedPlanCheck();
assert(configuredCheckoutNormalizedPlan.statusCode === 500, 'Checkout should normalize configured plan keys before Stripe config checks.');
assert(configuredCheckoutNormalizedPlan.body?.error === 'Stripe is not configured', 'Checkout should reach Stripe config after normalizing plan keys.');

for (const [planKey, plan] of Object.entries(PLAN_CATALOG)) {
  const configuredCheckoutPlan = runConfiguredCheckoutCatalogPlanCheck(planKey, plan.priceEnv);
  assert(configuredCheckoutPlan.statusCode === 500, `Checkout should reach Stripe config for configured ${planKey} plan.`);
  assert(configuredCheckoutPlan.body?.error === 'Stripe is not configured', `Checkout should report missing Stripe secret for configured ${planKey} plan.`);
}

const checkoutMissingAppBaseUrl = runMissingAppBaseUrlWithStripeCheck();
assert(checkoutMissingAppBaseUrl.statusCode === 500, 'Checkout should fail safely without APP_BASE_URL when Stripe env is configured.');
assert(checkoutMissingAppBaseUrl.body?.error === 'App base URL is not configured', 'Checkout should report missing APP_BASE_URL.');

const checkoutInvalidAppBaseUrl = runInvalidAppBaseUrlWithStripeCheck();
assert(checkoutInvalidAppBaseUrl.statusCode === 500, 'Checkout should fail safely with invalid APP_BASE_URL.');
assert(checkoutInvalidAppBaseUrl.body?.error === 'App base URL is invalid', 'Checkout should report invalid APP_BASE_URL.');

const redirectUrls = buildCheckoutRedirectUrls('https://example.com', ' Bundle3 ');
assert(
  redirectUrls.successUrl === 'https://example.com/success.html?session_id={CHECKOUT_SESSION_ID}&plan=bundle3',
  'Checkout should send Stripe success redirects to the static success page with normalized plan metadata.'
);
assert(
  redirectUrls.cancelUrl === 'https://example.com/cancel.html?plan=bundle3',
  'Checkout should send Stripe cancel redirects to the static cancel page with normalized plan metadata.'
);

const webhookWrongMethod = await callHandler(stripeWebhookHandler, {
  method: 'GET',
  headers: {},
  [Symbol.asyncIterator]: async function* () {}
});
assert(webhookWrongMethod.statusCode === 405, 'Stripe webhook should reject non-POST requests.');
assert(webhookWrongMethod.headers.Allow === 'POST', 'Stripe webhook should return Allow: POST for wrong method.');

const webhookMissingConfig = await callHandler(stripeWebhookHandler, {
  method: 'POST',
  headers: {},
  [Symbol.asyncIterator]: async function* () {
    yield Buffer.from('{}');
  }
});
assert(webhookMissingConfig.statusCode === 500, 'Stripe webhook should fail safely without webhook env.');
assert(webhookMissingConfig.body?.error === 'Stripe webhook is not configured', 'Stripe webhook should report missing webhook config.');

const normalizedWebhookPlan = getPlanAccess(' Bundle3 ');
assert(normalizedWebhookPlan.plan === 'bundle3', 'Stripe webhook should normalize plan metadata before entitlement mapping.');
assert(normalizedWebhookPlan.checks === 3, 'Stripe webhook should preserve bundle entitlement after plan normalization.');
for (const [planKey, plan] of Object.entries(PLAN_CATALOG)) {
  const access = getPlanAccess(planKey);
  assert(shouldFulfillPlan(planKey) === true, `Stripe webhook should fulfill configured ${planKey} plan.`);
  assert(access.plan === planKey, `Stripe webhook should preserve ${planKey} entitlement plan key.`);
  assert(access.checks === plan.checks, `Stripe webhook should preserve ${planKey} entitlement checks.`);
  assert(access.subscription === plan.subscription, `Stripe webhook should preserve ${planKey} subscription entitlement.`);
}
assert(shouldFulfillPlan('single') === true, 'Stripe webhook should fulfill known paid plans.');
assert(shouldFulfillPlan('not-real') === false, 'Stripe webhook should not fulfill unknown paid plan metadata.');

const session = await callHandler(sessionStatusHandler, {
  method: 'GET',
  query: { session_id: 'cs_test_missing' }
});
assert(session.statusCode === 200, 'Session status should return 200 for unknown session.');
assert(session.body?.ok === true && session.body?.found === false, 'Unknown session should return found=false.');

const sessionWrongMethod = await callHandler(sessionStatusHandler, {
  method: 'POST',
  query: { session_id: 'cs_test_missing' }
});
assert(sessionWrongMethod.statusCode === 405, 'Session status should reject non-GET requests.');
assert(sessionWrongMethod.headers.Allow === 'GET', 'Session status should return Allow: GET for wrong method.');

const sessionMissingId = await callHandler(sessionStatusHandler, {
  method: 'GET',
  query: {}
});
assert(sessionMissingId.statusCode === 400, 'Session status should require session_id.');
assert(sessionMissingId.body?.error === 'session_id is required', 'Session status should report missing session_id.');

savePurchase({
  sessionId: '  cs_test_paid  ',
  customerEmail: 'buyer@example.com',
  customerId: 'cus_test_buyer',
  plan: 'bundle3',
  entitlement: { plan: 'bundle3', checks: 3, subscription: false },
  paymentStatus: 'paid'
});
const sessionFound = await callHandler(sessionStatusHandler, {
  method: 'GET',
  query: { session_id: '  cs_test_paid  ' }
});
assert(sessionFound.statusCode === 200, 'Session status should return 200 for saved sessions.');
assert(sessionFound.body?.ok === true && sessionFound.body?.found === true, 'Saved session should return found=true.');
assert(sessionFound.body?.record?.sessionId === 'cs_test_paid', 'Saved session should normalize session_id before persistence.');
assert(sessionFound.body?.record?.plan === 'bundle3', 'Saved session should preserve purchased plan.');
assert(sessionFound.body?.record?.entitlement?.checks === 3, 'Saved session should preserve plan entitlement.');

const purchaseStateTempDir = mkdtempSync(join(tmpdir(), 'vin-purchase-state-'));
const purchaseStateFile = join(purchaseStateTempDir, 'purchases.json');
try {
  const fileSaveScript = `
    import { savePurchase } from './lib/purchase-state.js';
    savePurchase({
      sessionId: 'cs_test_file_paid',
      customerEmail: 'file-buyer@example.com',
      customerId: 'cus_test_file_buyer',
      plan: 'single',
      entitlement: { plan: 'single', checks: 1, subscription: false },
      paymentStatus: 'paid'
    });
  `;

  const fileSave = spawnSync(process.execPath, ['--input-type=module', '--eval', fileSaveScript], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      PURCHASE_STATE_FILE: purchaseStateFile
    },
    encoding: 'utf8'
  });

  assert(fileSave.status === 0, `File-backed purchase save failed: ${fileSave.stderr || fileSave.stdout}`);

  const originalPurchaseStateFile = process.env.PURCHASE_STATE_FILE;
  process.env.PURCHASE_STATE_FILE = purchaseStateFile;
  const fileBackedSession = await callHandler(sessionStatusHandler, {
    method: 'GET',
    query: { session_id: 'cs_test_file_paid' }
  });
  if (originalPurchaseStateFile == null) {
    delete process.env.PURCHASE_STATE_FILE;
  } else {
    process.env.PURCHASE_STATE_FILE = originalPurchaseStateFile;
  }

  assert(fileBackedSession.statusCode === 200, 'Session status should return 200 for file-backed sessions.');
  assert(fileBackedSession.body?.found === true, 'Session status should find purchases saved outside the current runtime.');
  assert(fileBackedSession.body?.record?.customerEmail === 'file-buyer@example.com', 'File-backed session should preserve customer email.');
} finally {
  rmSync(purchaseStateTempDir, { recursive: true, force: true });
}

const decodeWrongMethod = await callHandler(decodeHandler, {
  method: 'POST',
  query: { vin: 'WBAJA7C57JWA72863' }
});
assert(decodeWrongMethod.statusCode === 405, 'Decode API should reject non-GET requests.');
assert(decodeWrongMethod.headers.Allow === 'GET', 'Decode API should return Allow: GET for wrong method.');

const decodeMissingVin = await callHandler(decodeHandler, {
  method: 'GET',
  query: { vin: 'SHORT' }
});
assert(decodeMissingVin.statusCode === 400, 'Decode API should require a valid VIN.');
assert(decodeMissingVin.body?.ok === false, 'Decode API invalid VIN response should be ok=false.');
assert(decodeMissingVin.body?.error === 'Valid VIN required', 'Decode API should report invalid VIN.');

const decodeMissingQuery = await callHandler(decodeHandler, {
  method: 'GET'
});
assert(decodeMissingQuery.statusCode === 400, 'Decode API should handle missing query objects.');
assert(decodeMissingQuery.body?.ok === false, 'Decode API missing-query response should be ok=false.');
assert(decodeMissingQuery.body?.error === 'Valid VIN required', 'Decode API should report invalid VIN when query is missing.');

const decodeFixture = await callHandler(decodeHandler, {
  method: 'GET',
  query: { vin: 'WBAJA7C57JWA72863' }
});
assert(decodeFixture.statusCode === 200, 'Decode API should return 200 for fixture VIN.');
assert(decodeFixture.body?.ok === true, 'Decode API fixture response should be ok.');
assert(decodeFixture.body?.decoded?.make === 'BMW', 'Decode API fixture should decode as BMW.');
assert(decodeFixture.body?.decoded?.nhtsa?.isClean === true, 'Decode API fixture should preserve clean NHTSA status.');

const recallsWrongMethod = await callHandler(recallsHandler, {
  method: 'POST',
  query: { vin: 'WBAJA7C57JWA72863' }
});
assert(recallsWrongMethod.statusCode === 405, 'Recalls API should reject non-GET requests.');
assert(recallsWrongMethod.headers.Allow === 'GET', 'Recalls API should return Allow: GET for wrong method.');

const recallsMissingVin = await callHandler(recallsHandler, {
  method: 'GET',
  query: { vin: 'SHORT' }
});
assert(recallsMissingVin.statusCode === 400, 'Recalls API should require a valid VIN.');
assert(recallsMissingVin.body?.ok === false, 'Recalls API invalid VIN response should be ok=false.');
assert(recallsMissingVin.body?.error === 'Valid VIN required', 'Recalls API should report invalid VIN.');

const recallsMissingQuery = await callHandler(recallsHandler, {
  method: 'GET'
});
assert(recallsMissingQuery.statusCode === 400, 'Recalls API should handle missing query objects.');
assert(recallsMissingQuery.body?.ok === false, 'Recalls API missing-query response should be ok=false.');
assert(recallsMissingQuery.body?.error === 'Valid VIN required', 'Recalls API should report invalid VIN when query is missing.');

const recallsFixture = await callHandler(recallsHandler, {
  method: 'GET',
  query: { vin: 'WBAJA7C57JWA72863' }
});
assert(recallsFixture.statusCode === 200, 'Recalls API should return 200 for fixture VIN.');
assert(recallsFixture.body?.ok === true, 'Recalls API fixture response should be ok.');
assert(recallsFixture.body?.vin === 'WBAJA7C57JWA72863', 'Recalls API should normalize VIN in fixture response.');
assert(recallsFixture.body?.count === 0, 'Recalls API should preserve fixture recall count.');
assert(Array.isArray(recallsFixture.body?.recalls), 'Recalls API should return recalls array.');

const historyWrongMethod = await callHandler(historyHandler, {
  method: 'POST',
  query: { vin: 'WBAJA7C57JWA72863' }
});
assert(historyWrongMethod.statusCode === 405, 'History API should reject non-GET requests.');
assert(historyWrongMethod.headers.Allow === 'GET', 'History API should return Allow: GET for wrong method.');

const historyMissingVin = await callHandler(historyHandler, {
  method: 'GET',
  query: { vin: 'SHORT' }
});
assert(historyMissingVin.statusCode === 400, 'History API should require a valid VIN.');
assert(historyMissingVin.body?.ok === false, 'History API invalid VIN response should be ok=false.');
assert(historyMissingVin.body?.error === 'Valid VIN required', 'History API should report invalid VIN.');

const historyMissingQuery = await callHandler(historyHandler, {
  method: 'GET'
});
assert(historyMissingQuery.statusCode === 400, 'History API should handle missing query objects.');
assert(historyMissingQuery.body?.ok === false, 'History API missing-query response should be ok=false.');
assert(historyMissingQuery.body?.error === 'Valid VIN required', 'History API should report invalid VIN when query is missing.');

const dashboardWrongMethod = await callHandler(dashboardHandler, {
  method: 'POST',
  query: { vin: 'WBAJA7C57JWA72863' }
});
assert(dashboardWrongMethod.statusCode === 405, 'Vehicle dashboard should reject non-GET requests.');
assert(dashboardWrongMethod.headers.Allow === 'GET', 'Vehicle dashboard should return Allow: GET for wrong method.');

const dashboardMissingVin = await callHandler(dashboardHandler, {
  method: 'GET',
  query: { vin: 'SHORT' }
});
assert(dashboardMissingVin.statusCode === 400, 'Vehicle dashboard should require a valid VIN.');
assert(dashboardMissingVin.body?.ok === false, 'Vehicle dashboard invalid VIN response should be ok=false.');
assert(dashboardMissingVin.body?.error === 'Valid VIN required', 'Vehicle dashboard should report invalid VIN.');

const dashboardMissingQuery = await callHandler(dashboardHandler, {
  method: 'GET'
});
assert(dashboardMissingQuery.statusCode === 400, 'Vehicle dashboard should handle missing query objects.');
assert(dashboardMissingQuery.body?.ok === false, 'Vehicle dashboard missing-query response should be ok=false.');
assert(dashboardMissingQuery.body?.error === 'Valid VIN required', 'Vehicle dashboard should report invalid VIN when query is missing.');

const dashboardInvalidPrice = await callHandler(dashboardHandler, {
  method: 'GET',
  query: { vin: 'WBAJA7C57JWA72863', asking_price: 'not-a-price' }
});
assert(dashboardInvalidPrice.statusCode === 400, 'Vehicle dashboard should reject invalid asking_price values.');
assert(
  dashboardInvalidPrice.body?.error === 'asking_price must be a non-negative number',
  'Vehicle dashboard should report invalid asking_price values.'
);

const dashboardInvalidMileage = await callHandler(dashboardHandler, {
  method: 'GET',
  query: { vin: 'WBAJA7C57JWA72863', mileage: '-1' }
});
assert(dashboardInvalidMileage.statusCode === 400, 'Vehicle dashboard should reject invalid mileage values.');
assert(
  dashboardInvalidMileage.body?.error === 'mileage must be a non-negative number',
  'Vehicle dashboard should report invalid mileage values.'
);

const dashboardMissingPrice = await callHandler(dashboardHandler, {
  method: 'GET',
  query: { vin: 'WBAJA7C57JWA72863', mileage: '72000' }
});
assert(dashboardMissingPrice.statusCode === 200, 'Vehicle dashboard should allow missing asking_price.');
assert(
  dashboardMissingPrice.body?.dashboard?.pricingContext?.midpoint === null,
  'Vehicle dashboard should not invent a midpoint without asking_price.'
);
assert(
  dashboardMissingPrice.body?.dashboard?.pricingContext?.confidence === 'missing_asking_price',
  'Vehicle dashboard should flag missing asking_price in pricing confidence.'
);

const dashboardConditionNormalization = await callHandler(dashboardHandler, {
  method: 'GET',
  query: {
    vin: 'WBAJA7C57JWA72863',
    asking_price: '24900',
    mileage: '72000',
    condition: 'Very_Good'
  }
});
assert(dashboardConditionNormalization.statusCode === 200, 'Vehicle dashboard should allow normalized condition values.');
assert(
  dashboardConditionNormalization.body?.dashboard?.pricingContext?.condition === 'very good',
  'Vehicle dashboard should normalize condition labels before valuation.'
);
assert(
  dashboardConditionNormalization.body?.dashboard?.pricingContext?.adjustmentSummary?.conditionAdjustment === 600,
  'Vehicle dashboard should apply normalized condition adjustments.'
);

const originalVehicleHistoryApiUrl = process.env.VEHICLE_HISTORY_API_URL;
const originalVehicleHistoryApiKey = process.env.VEHICLE_HISTORY_API_KEY;
const originalAuctionEvidenceApiUrl = process.env.AUCTION_EVIDENCE_API_URL;
const originalAuctionEvidenceApiKey = process.env.AUCTION_EVIDENCE_API_KEY;
try {
  process.env.VEHICLE_HISTORY_API_URL = 'https://vehicle-history.example.test';
  delete process.env.VEHICLE_HISTORY_API_KEY;

  const dashboardPartialProvider = await callHandler(dashboardHandler, {
    method: 'GET',
    query: {
      vin: 'WBAJA7C57JWA72863',
      asking_price: '24900',
      mileage: '72000'
    }
  });
  assert(dashboardPartialProvider.statusCode === 200, 'Vehicle dashboard should return 200 with partial provider config.');
  assert(
    dashboardPartialProvider.body?.integrationStatus?.vehicleHistory === 'partial',
    'Vehicle dashboard should surface partial vehicle-history provider config.'
  );

  const historyPartialProvider = await callHandler(historyHandler, {
    method: 'GET',
    query: { vin: 'WBAJA7C57JWA72863' }
  });
  assert(historyPartialProvider.statusCode === 200, 'History API should return 200 with partial provider config.');
  assert(
    historyPartialProvider.body?.integrationStatus?.vehicleHistory === 'partial',
    'History API should surface partial vehicle-history provider config.'
  );

  process.env.VEHICLE_HISTORY_API_URL = 'not-a-url';
  process.env.VEHICLE_HISTORY_API_KEY = 'provider_key_placeholder';

  const dashboardInvalidHistoryProvider = await callHandler(dashboardHandler, {
    method: 'GET',
    query: {
      vin: 'WBAJA7C57JWA72863',
      asking_price: '24900',
      mileage: '72000'
    }
  });
  assert(dashboardInvalidHistoryProvider.statusCode === 200, 'Vehicle dashboard should return 200 with invalid history provider config.');
  assert(
    dashboardInvalidHistoryProvider.body?.integrationStatus?.vehicleHistory === 'invalid_config',
    'Vehicle dashboard should surface invalid vehicle-history provider config.'
  );

  const historyInvalidHistoryProvider = await callHandler(historyHandler, {
    method: 'GET',
    query: { vin: 'WBAJA7C57JWA72863' }
  });
  assert(historyInvalidHistoryProvider.statusCode === 200, 'History API should return 200 with invalid history provider config.');
  assert(
    historyInvalidHistoryProvider.body?.integrationStatus?.vehicleHistory === 'invalid_config',
    'History API should surface invalid vehicle-history provider config.'
  );

  process.env.AUCTION_EVIDENCE_API_URL = 'not-a-url';
  process.env.AUCTION_EVIDENCE_API_KEY = 'provider_key_placeholder';

  const dashboardInvalidAuctionProvider = await callHandler(dashboardHandler, {
    method: 'GET',
    query: {
      vin: 'WBAJA7C57JWA72863',
      asking_price: '24900',
      mileage: '72000'
    }
  });
  assert(dashboardInvalidAuctionProvider.statusCode === 200, 'Vehicle dashboard should return 200 with invalid auction provider config.');
  assert(
    dashboardInvalidAuctionProvider.body?.integrationStatus?.auctionEvidence === 'invalid_config',
    'Vehicle dashboard should surface invalid auction provider config before public auction evidence.'
  );

  const historyInvalidAuctionProvider = await callHandler(historyHandler, {
    method: 'GET',
    query: { vin: 'WBAJA7C57JWA72863' }
  });
  assert(historyInvalidAuctionProvider.statusCode === 200, 'History API should return 200 with invalid auction provider config.');
  assert(
    historyInvalidAuctionProvider.body?.integrationStatus?.auctionEvidence === 'invalid_config',
    'History API should surface invalid auction provider config before public auction evidence.'
  );
} finally {
  if (originalVehicleHistoryApiUrl == null) {
    delete process.env.VEHICLE_HISTORY_API_URL;
  } else {
    process.env.VEHICLE_HISTORY_API_URL = originalVehicleHistoryApiUrl;
  }
  if (originalVehicleHistoryApiKey == null) {
    delete process.env.VEHICLE_HISTORY_API_KEY;
  } else {
    process.env.VEHICLE_HISTORY_API_KEY = originalVehicleHistoryApiKey;
  }
  if (originalAuctionEvidenceApiUrl == null) {
    delete process.env.AUCTION_EVIDENCE_API_URL;
  } else {
    process.env.AUCTION_EVIDENCE_API_URL = originalAuctionEvidenceApiUrl;
  }
  if (originalAuctionEvidenceApiKey == null) {
    delete process.env.AUCTION_EVIDENCE_API_KEY;
  } else {
    process.env.AUCTION_EVIDENCE_API_KEY = originalAuctionEvidenceApiKey;
  }
}

const dashboard = await callHandler(dashboardHandler, {
  method: 'GET',
  query: {
    vin: 'WBAJA7C57JWA72863',
    asking_price: '24900',
    mileage: '72000'
  }
});
assert(dashboard.statusCode === 200, 'Vehicle dashboard should return 200 for fixture VIN.');
assert(dashboard.body?.ok === true, 'Vehicle dashboard response should be ok.');
assert(dashboard.body?.dashboard?.vehicleIdentity?.make === 'BMW', 'Fixture VIN should decode as BMW.');
assert(dashboard.body?.dashboard?.buyerRecommendation?.verdict === 'verify_further', 'Fixture should require verification.');
assert(dashboard.body?.integrationStatus?.auctionEvidence === 'public_indexed_match', 'Fixture should include public auction evidence.');

console.log(JSON.stringify({
  ok: true,
  checks: [
    'checkout_missing_price_env',
    'checkout_missing_stripe_env_after_price_config',
    'checkout_wrong_method',
    'checkout_missing_price_without_stripe_env',
    'checkout_missing_price_with_stripe_env',
    'checkout_normalized_plan_key',
    'checkout_catalog_plan_price_envs',
    'checkout_missing_app_base_url',
    'checkout_invalid_app_base_url',
    'checkout_static_redirect_urls',
    'stripe_webhook_wrong_method',
    'stripe_webhook_missing_config',
    'stripe_webhook_plan_normalization',
    'stripe_webhook_catalog_entitlements',
    'stripe_webhook_unknown_plan_not_fulfilled',
    'session_status_unknown_session',
    'session_status_wrong_method',
    'session_status_missing_session_id',
    'session_status_saved_session',
    'session_status_normalized_saved_session',
    'session_status_file_backed_session',
    'decode_wrong_method',
    'decode_invalid_vin',
    'decode_missing_query',
    'decode_fixture',
    'recalls_wrong_method',
    'recalls_invalid_vin',
    'recalls_missing_query',
    'recalls_fixture',
    'history_wrong_method',
    'history_invalid_vin',
    'history_missing_query',
    'vehicle_dashboard_wrong_method',
    'vehicle_dashboard_invalid_vin',
    'vehicle_dashboard_missing_query',
    'vehicle_dashboard_invalid_asking_price',
    'vehicle_dashboard_invalid_mileage',
    'vehicle_dashboard_missing_asking_price_pricing_unknown',
    'vehicle_dashboard_condition_normalization',
    'vehicle_dashboard_partial_provider_status',
    'history_partial_provider_status',
    'vehicle_dashboard_invalid_history_provider_status',
    'history_invalid_history_provider_status',
    'vehicle_dashboard_invalid_auction_provider_status',
    'history_invalid_auction_provider_status',
    'vehicle_dashboard_fixture'
  ],
  fixture: {
    vin: 'WBAJA7C57JWA72863',
    make: dashboard.body.dashboard.vehicleIdentity.make,
    verdict: dashboard.body.dashboard.buyerRecommendation.verdict,
    auctionEvidence: dashboard.body.integrationStatus.auctionEvidence
  }
}, null, 2));
