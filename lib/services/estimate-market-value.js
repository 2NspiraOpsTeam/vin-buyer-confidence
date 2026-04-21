export function estimateMarketValue({ askingPrice = null, mileage = null, condition = 'good' }) {
  const base = askingPrice || 0;
  const mileageAdjustment = mileage == null ? 0 : (mileage > 80000 ? -2200 : mileage > 60000 ? -1200 : mileage > 40000 ? -500 : 600);
  const conditionAdjustmentMap = {
    excellent: 1200,
    'very good': 600,
    good: 0,
    fair: -1200,
    poor: -3000
  };
  const conditionAdjustment = conditionAdjustmentMap[condition] ?? 0;
  const midpoint = base + mileageAdjustment + conditionAdjustment;
  const low = midpoint - 1500;
  const high = midpoint + 1500;
  const spread = askingPrice == null ? 0 : askingPrice - midpoint;
  const position = spread > 1500 ? 'high' : spread < -1500 ? 'below_market' : 'fair';
  return {
    condition,
    estimatedRangeLow: low || null,
    estimatedRangeHigh: high || null,
    midpoint: midpoint || null,
    position,
    adjustmentSummary: {
      mileageAdjustment,
      conditionAdjustment
    },
    negotiationRoom: spread > 0 ? Math.round(spread) : 0,
    confidence: 'scaffolded'
  };
}
