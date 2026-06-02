# VIN Presence Check

## Overview

The VIN Presence Check feature identifies external sources where a vehicle's VIN has been found online. This helps verify vehicle listings and provides visibility into where the vehicle appears across the web.

## Implementation

### Provider Module

**File:** `lib/providers/vin-presence.js`

The provider module includes:

- `buildVinPresenceLinks({ vin })` - Generates search links for manual VIN lookups on popular automotive sites
- `getVinPresenceSnapshot({ vin, browser })` - Fetches VIN presence data from configured external sources

When a browser is provided, the provider will attempt to visit each site and verify VIN presence. When no browser is available, it returns search links for manual review.

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
      "status": "vin_found" | "vin_not_found" | "search_links_available" | "browser_error",
      "vin": "5UX23EM06P9R83357",
      "sources": [
        {
          "source": "carvision",
          "label": "CarVision",
          "url": "https://carvision.com/...",
          "vin": "5UX23EM06P9R83357",
          "found": true,
          "confidence": "verified_by_browser",
          "note": "VIN found on site"
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

### Browser Integration

To enable live VIN presence verification, the browser must be passed to `getVinPresenceSnapshot`. The API handler currently returns search links for manual review when no browser is available.

### Manual Search Links

When no browser is configured, the provider returns `searchLinks` for manual web searches on:
- CarVision
- VINAnalytics
- AutosToday
- Edmunds
- DriversHub
- Facebook Marketplace
- Craigslist

## Usage

The VIN presence check runs automatically as part of the vehicle dashboard build process. No additional code changes are required.

### Example Response (No Browser Available)

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
  "note": "No VIN presence API or browser is configured. Manual search links are available for review."
}
```

## Next Steps

1. **Browser Integration** - Pass the browser to `getVinPresenceSnapshot` to enable live site verification
2. **Review Search Results** - When no browser is configured, manually review the search links to verify VIN presence
3. **Integrate with Buyer Recommendation** - Use VIN presence data to strengthen or weaken buyer recommendations
