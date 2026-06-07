# Source-Confidence Legend and Evidence-Card Hierarchy

## Overview

This document defines the visual language and hierarchy for displaying source confidence across the VIN Buyer Confidence product.

## Status Definitions

| Status | Meaning | Visual Treatment | Language |
|--------|---------|------------------|----------|
| `confirmed` | Strong evidence supports this claim | ✅ Green check + green accent | "Confirmed" / "Verified" |
| `partial` | Some evidence present, but support is missing | ⚠️ Yellow warning + yellow accent | "Partial" / "Needs more evidence" |
| `not_connected` | Source is not available yet | ℹ️ Blue info + blue accent | "Not connected" / "Unavailable" |
| `needs_verification` | Claim may be plausible but evidence is thin | ❓ Gray question + gray accent | "Needs verification" / "Unconfirmed" |

## Evidence-Card Hierarchy

### Primary Evidence Cards (Top Priority)
These cards show the most critical evidence sources that directly impact the buyer's decision:

1. **VIN Identity**
   - Status: confirmed/partial/not_connected
   - Language: "VIN decodes cleanly" / "VIN decode needs verification"
   - Icon: 🆔

2. **Recalls & Safety**
   - Status: confirmed/partial/not_connected
   - Language: "Recalls checked" / "Recall data unavailable"
   - Icon: ⚠️

3. **Market Context**
   - Status: confirmed/partial/not_connected
   - Language: "Market data available" / "Market data unavailable"
   - Icon: 📊

4. **History**
   - Status: confirmed/partial/not_connected
   - Language: "History verified" / "History data unavailable"
   - Icon: 📜

5. **Listing Evidence**
   - Status: confirmed/partial/not_connected
   - Language: "Listing matches" / "Listing needs verification"
   - Icon: 📋

6. **Photo Evidence**
   - Status: confirmed/partial/not_connected
   - Language: "Photos verified" / "Photo evidence unavailable"
   - Icon: 📷

### Secondary Evidence Cards (Supporting)
These cards provide additional context and depth:

7. **Seller Questions**
   - Status: needs_verification/not_connected
   - Language: "Questions generated" / "Questions unavailable"
   - Icon: 💬

8. **Price Context**
   - Status: confirmed/partial/not_connected
   - Language: "Price verified" / "Price needs verification"
   - Icon: 💰

9. **Mileage History**
   - Status: confirmed/partial/not_connected
   - Language: "Mileage verified" / "Mileage needs verification"
   - Icon: 📏

10. **Service Records**
    - Status: confirmed/partial/not_connected
    - Language: "Service history verified" / "Service history unavailable"
    - Icon: 🛠️

## Visual Implementation

### Status Chips
```css
.state-chip.confirmed {
  background: rgba(126, 231, 135, 0.12);
  color: var(--accent2);
  border: 1px solid rgba(126, 231, 135, 0.3);
}

.state-chip.partial {
  background: rgba(242, 204, 96, 0.12);
  color: var(--warn);
  border: 1px solid rgba(242, 204, 96, 0.3);
}

.state-chip.not_connected {
  background: rgba(88, 166, 255, 0.12);
  color: var(--accent);
  border: 1px solid rgba(88, 166, 255, 0.3);
}

.state-chip.needs_verification {
  background: rgba(166, 176, 204, 0.12);
  color: var(--muted);
  border: 1px solid rgba(166, 176, 204, 0.3);
}
```

### Evidence Card Layout
```html
<div class="evidence-card">
  <div class="evidence-header">
    <span class="evidence-icon">🆔</span>
    <span class="evidence-title">VIN Identity</span>
    <span class="state-chip confirmed">Confirmed</span>
  </div>
  <div class="evidence-body">
    <p class="evidence-text">VIN decodes cleanly to 2018 BMW 340i xDrive</p>
    <p class="evidence-source">Source: NHTSA, DMV records</p>
  </div>
</div>
```

### Confidence Score Display
The overall confidence score should reflect the balance between:
- **Confirmed evidence** (positive weight)
- **Partial evidence** (neutral weight)
- **Not connected evidence** (negative weight)
- **Needs verification evidence** (negative weight)

## Implementation Notes

1. **Consistency**: Every evidence block should show one of the four statuses
2. **Transparency**: Provider-not-ready states should feel transparent, not broken
3. **Visual Hierarchy**: Primary evidence cards should be more prominent than secondary cards
4. **Responsive Design**: Evidence cards should stack on mobile devices
5. **Accessibility**: Status chips should include both color and text indicators

## Next Steps

1. Implement status chip styles in CSS
2. Update evidence-card HTML structure
3. Update JavaScript to populate status chips
4. Test across devices and screen sizes
5. Review with Maya for copy consistency
