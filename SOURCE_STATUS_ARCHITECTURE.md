# Source Status Architecture

## Status Definitions

| Status | Meaning | Language |
|--------|---------|----------|
| `confirmed` | Strong evidence supports this claim | "Confirmed" / "Verified" |
| `partial` | Some evidence present, but support is missing | "Partial" / "Needs more evidence" |
| `not_connected` | Source is not available yet | "Not connected" / "Unavailable" |
| `needs_verification` | Claim may be plausible but evidence is thin | "Needs verification" / "Unconfirmed" |

## Evidence Sources

| Source | Status States | Language |
|--------|---------------|----------|
| VIN Identity | confirmed, partial, not_connected | "VIN decodes cleanly" / "VIN decode needs verification" |
| Recalls | confirmed, partial, not_connected | "Recalls checked" / "Recall data unavailable" |
| Market Context | confirmed, partial, not_connected | "Market data available" / "Market data unavailable" |
| History | confirmed, partial, not_connected | "History verified" / "History data unavailable" |
| Listing Evidence | confirmed, partial, not_connected | "Listing matches" / "Listing needs verification" |
| Photo Evidence | confirmed, partial, not_connected | "Photos verified" / "Photo evidence unavailable" |
| Seller Questions | needs_verification, not_connected | "Questions generated" / "Questions unavailable" |

## Implementation Notes

- Every evidence block should show one of the four statuses
- Status language should be consistent across `/live` and `/customer`
- Provider-not-ready states should feel transparent, not broken
- Use status chips to show the current state of each evidence source
