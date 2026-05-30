# VIN Buyer Confidence Prototype

Static-first buyer-confidence prototype with Vercel-style API handlers for checkout, webhook fulfillment, session activation, readiness checks, and the unified vehicle dashboard.

## Run locally

For the static pages only, from this folder:

```bash
python3 -m http.server 8787
```

Then open:

- http://127.0.0.1:8787

The static server does not run the API handlers. Use the npm scripts below for no-secret API verification, or deploy to a Vercel-compatible runtime for live checkout/webhook behavior.

## Files

- `index.html` - landing page prototype
- `checkout.html` - trial/demo/payment-entry surface
- `live.html` - free VIN workflow
- `customer.html` - buyer workspace preview
- `account.html` and `success.html` - post-payment account/session surfaces
- `api/` - checkout, webhook, session, and dashboard handlers
- `scripts/` - readiness and smoke-test scripts

## Next steps

- configure Stripe/payment environment variables
- connect durable entitlement persistence
- connect live vehicle-data providers
- deploy to a Vercel-compatible runtime when ready for live checkout


## Stripe environment variables

Set these in Vercel before live checkout can work:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_SINGLE`
- `STRIPE_PRICE_BUNDLE3`
- `STRIPE_PRICE_UNLIMITED`
- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL`
- optional `PURCHASE_STATE_FILE` for local/staging JSON purchase persistence

Use `.env.example` as the deployment checklist. Do not commit real secret values.

Check revenue readiness from this folder:

```bash
npm run check:readiness
```

Expected behavior:
- exits nonzero until all required Stripe/payment environment variables are set
- reports missing environment variable names without printing secret values
- reports invalid Stripe/payment value formats without printing secret values
- accepts `https://` app URLs for deployment and `localhost`/`127.0.0.1` app URLs for local checkout testing
- reports optional vehicle-data provider status, including ready providers, partial URL/key pairs, and the next live-evidence action
- treats malformed optional provider URLs as not ready for live evidence
- treats whitespace-only environment variable values as missing
- exposes web photo search links by VIN by default, with optional automatic image-search candidates when `WEB_IMAGE_SEARCH_API_URL` and `WEB_IMAGE_SEARCH_API_KEY` are configured

Run the no-secret verification suite before deployment changes:

```bash
npm test
```

Run tests plus dependency audit:

```bash
npm run verify
```

Test payment and provider readiness failure/success paths with placeholder values:

```bash
npm run test:readiness
```

Run no-secret API smoke checks from this folder:

```bash
npm run test:smoke
```

The smoke check stubs NHTSA responses so it is deterministic and does not depend on external API availability. It verifies:

- safe checkout failure when price or Stripe environment variables are missing
- checkout method, unconfigured-plan, normalized-plan, catalog price-env, whitespace price-env, missing-`APP_BASE_URL`, invalid-`APP_BASE_URL`, and whitespace config guards
- webhook method, missing-config, whitespace-config, plan-normalization, catalog entitlement, and unknown-plan fulfillment guards
- empty, invalid, and saved session lookup behavior
- paid session entitlement shape for the account/success pages
- direct NHTSA decode and recalls method/VIN/missing-query/fixture guards
- history API method, VIN, and missing-query guards
- vehicle dashboard method, VIN, missing-query, price, mileage, missing-price, condition-normalization, partial-provider, invalid-history-provider, and invalid-auction-provider status guards
- history API partial-provider and invalid-provider status guards
- BMW dashboard fixture with public auction evidence

Current status:
- checkout session creation is scaffolded behind Stripe env readiness checks
- Stripe redirect flow is scaffolded
- webhook fulfillment endpoint is scaffolded
- warm-runtime entitlement lookup is implemented with in-memory state
- optional local/staging file-backed entitlement lookup is available via `PURCHASE_STATE_FILE`
- production-grade durable entitlement persistence is not implemented yet

Persistence note:
- prototype uses in-memory purchase state by default
- set `PURCHASE_STATE_FILE=/absolute/path/to/purchases.json` to persist purchase activations across local/staging process restarts
- `/api/session-status` can read purchase activation by `session_id` from memory or the configured JSON state file
- no production database is connected yet; use a managed database/KV store before paid production traffic


## Unified vehicle dashboard endpoint

Current endpoint:
- `GET /api/vehicle-dashboard?vin=...&asking_price=...&mileage=...&listing_url=...&condition=...`

Current status:
- NHTSA identity/recalls connected
- MarketCheck/Auto.dev/Monroney scaffolds present
- premium dashboard contract expanded for history, valuation, safety, recalls, reviews, comps
