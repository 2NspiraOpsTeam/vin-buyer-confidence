# VIN Buyer Confidence Prototype

Simple static prototype for the BMW Buy/Pass Review landing page.

## Run locally

From this folder:

```bash
python3 -m http.server 8787
```

Then open:

- http://127.0.0.1:8787

## Files

- `index.html` - landing page prototype

## Next steps

- connect intake form
- connect payment flow
- add sample report page
- migrate to app stack when validated


## Stripe environment variables

Set these in Vercel before live checkout can work:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_SINGLE`
- `STRIPE_PRICE_BUNDLE3`
- `STRIPE_PRICE_UNLIMITED`
- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL`

Current status:
- checkout session creation is scaffolded
- Stripe redirect flow is scaffolded
- webhook fulfillment endpoint is scaffolded
- entitlement persistence is not implemented yet

Persistence note:
- prototype uses in-memory purchase state only
- `/api/session-status` can read purchase activation by `session_id` during a warm runtime
- no durable database is connected yet


## Unified vehicle dashboard endpoint

Current endpoint:
- `GET /api/vehicle-dashboard?vin=...&asking_price=...&mileage=...&listing_url=...&condition=...`

Current status:
- NHTSA identity/recalls connected
- MarketCheck/Auto.dev/Monroney scaffolds present
- premium dashboard contract expanded for history, valuation, safety, recalls, reviews, comps
