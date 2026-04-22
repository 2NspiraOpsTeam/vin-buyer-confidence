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
