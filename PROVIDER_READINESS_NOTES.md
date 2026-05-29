# Provider Readiness Notes

## MarketCheck
Status:
- infrastructure scaffolded
- normalized listing/comps fields scaffolded
- API key env name reserved: MARKETCHECK_API_KEY

Next implementation steps:
1. choose exact MarketCheck endpoint(s) for VIN/listing/comps
2. wire authenticated fetch in lib/providers/marketcheck.js
3. map photos, price, mileage, dealer, location, listing URL, and comp cards
4. cache expensive responses

## Auto.dev
Status:
- scaffolded only

Next implementation steps:
1. confirm plan/API tier
2. choose listing + photo endpoints
3. map into listingEvidence/marketComps
4. decide fallback role relative to MarketCheck

## MonroneyLabels
Status:
- scaffolded only

Next implementation steps:
1. confirm sticker/build endpoint access
2. map build/equipment into identity + listing evidence

## History provider
Status:
- provider boundary scaffolded
- API endpoint added: `GET /api/history?vin=...`
- generic env names reserved: `VEHICLE_HISTORY_API_URL`, `VEHICLE_HISTORY_API_KEY`
- no live licensed provider connected yet

Needed for:
- owner count
- registration states/dates
- title brands
- accident/damage
- odometer timeline
- service history

Important data boundary:
- Do not display prior owner names, addresses, or other DMV personal information in buyer-facing reports.
- Display owner count, ownership periods, usage type, title/registration states, odometer readings, title brands, accident/damage events, and service records when a licensed provider returns them.
- NMVTIS-style data is strongest for title, brand, theft, salvage/total-loss, and odometer/title records. Oil-change and maintenance records require a commercial vehicle-history or service-record provider and may still be incomplete.

Candidate provider categories:
1. NMVTIS/API distributor for title, brand, salvage/total-loss, theft, and odometer events.
2. Commercial history provider for ownership count, accident/damage, service, inspection, registration, and listing-history enrichment.
3. Seller-uploaded records for receipts, PPI, maintenance invoices, and photos that provider networks may miss.


## Auto.dev confirmed official endpoints
Confirmed from official Auto.dev docs:
- Listings by VIN: `GET https://api.auto.dev/listings/{vin}`
- Search listings: `GET https://api.auto.dev/listings`
- Photos by VIN: `GET https://api.auto.dev/photos/{vin}`
- Specs by VIN: `GET https://api.auto.dev/specs/{vin}`
- Auth: `Authorization: Bearer YOUR_API_KEY`

Source docs:
- https://docs.auto.dev/v2/products/vehicle-listings
- https://docs.auto.dev/v2/products/vehicle-photos
- https://docs.auto.dev/v2/products/specifications
- https://docs.auto.dev/

Implementation note:
- current code is now aligned to the documented base URL `https://api.auto.dev`
- next live step is to install `AUTODEV_API_KEY` and test the exact response shape against our account tier
