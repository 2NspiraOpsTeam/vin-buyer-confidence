# VIN Presence Check

## Overview

The VIN Presence Check feature identifies external sources where a vehicle's VIN has been found online. This helps verify vehicle listings and provides visibility into where the vehicle appears across the web.

## Implementation

### Provider Module

**File:** `lib/providers/vin-presence.js`

The provider module includes:

- `buildVinPresenceLinks({ vin })` - Generates search links for manual VIN lookups on popular automotive sites
- `getVinPresenceSnapshot({ vin })` - Fetches VIN presence data from configured external sources

### Integration

The VIN presence check is integrated into the vehicle dashboard via:

**File:** `lib/services/build-dashboard.js`

The `buildVehicleDashboard` function now includes:
- VIN presence check in the parallel provider fetches
- `vinPresence` field in the dashboard response
- `vin-presence` source in the `provenance` array

### API Response

The `vehicle-dashboard` API endpoint now includes:

```json
{
  "ok": true,
  "dashboard": {
    "vinPresence": {
      "provider": "vin-presence",
      "status": "vin_found" | "vin_not_found" | "search_links_available" | "configured_error",
      "vin": "5UX23EM06P9R83357",
      "sources": [
        {
          "source": "carvision-search",
          "url": "https://www.carvision.com/...",
          "title": "2023 BMW X7 xDrive40i",
          "vin": "5UX23EM06P9R83357",
          "make": "BMW",
          "model": "X7 xDrive40i",
          "year": "2023",
          "price": 44999,
          "mileage": 66833,
          "condition": "used",
          "listingUrl": "https://...",
          "foundAt": "2026-06-01T...",
          "confidence": "web_search_candidate"
        }
      ],
      "searchLinks": [...],
      "note": "VIN found on X external source(s). Verify each source before relying on the data."
    },
    "provenance": [
      ...
      { "source": "vin-presence", "status": "vin_found" }
    ]
  },
  "integrationStatus": {
    ...
    "vinPresence": "configured" | "not_configured" | "partial" | "invalid_config"
  }
}
```

## Configuration

To enable live VIN presence lookups, configure the following environment variables:

```bash
VIN_PRESENCE_API_URL=https://api.your-provider.com/vin-presence
VIN_PRESENCE_API_KEY=your_api_key_here
```

### Without API Configuration

When no API is configured, the provider returns `searchLinks` for manual web searches on:
- CarVision
- VINAnalytics
- AutoToday
- Edmunds
- DriversHub
- Facebook Marketplace
- Craigslist

## Usage

The VIN presence check runs automatically as part of the vehicle dashboard build process. No additional code changes are required.

### Example Response (No API Configured)

```json
{
  "provider": "vin-presence",
  "status": "search_links_available",
  "vin": "5UX23EM06P9R83357",
  "sources": [],
  "searchLinks": [
    {
      "label": "Search CarVision by VIN",
      "source": "carvision-search",
      "url": "https://www.carvision.com/search/?q=5UX23EM06P9R83357",
      "note": "Public vehicle listing search."
    },
    ...
  ],
  "note": "No VIN presence API is configured. Manual search links are available for review."
}
```

## Next Steps

1. **Configure VIN Presence API** - Set up a VIN presence search provider with the required API credentials
2. **Review Search Results** - When no API is configured, manually review the search links to verify VIN presence
3. **Integrate with Buyer Recommendation** - Use VIN presence data to strengthen or weaken buyer recommendations
