export const VEHICLE_DASHBOARD_CONTRACT = {
  vehicleIdentity: {
    vin: '',
    year: '',
    make: '',
    model: '',
    trim: '',
    source: '',
    confidence: ''
  },
  recallSignals: [],
  listingEvidence: {
    listingUrl: '',
    source: '',
    askingPrice: null,
    mileage: null,
    photos: [],
    dealer: null,
    location: null
  },
  marketComps: [],
  pricingContext: {
    askingPrice: null,
    estimatedRangeLow: null,
    estimatedRangeHigh: null,
    position: ''
  },
  historySignals: [],
  buyerRecommendation: {
    verdict: '',
    rationale: '',
    nextSteps: []
  },
  provenance: []
};
