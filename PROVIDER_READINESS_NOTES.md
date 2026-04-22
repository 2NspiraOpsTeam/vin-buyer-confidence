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
- not yet selected

Needed for:
- owner count
- registration states/dates
- title brands
- accident/damage
- odometer timeline
- service history
