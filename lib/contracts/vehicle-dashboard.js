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
  ownershipTimeline: [],
  registrationTimeline: [],
  titleHistory: [],
  accidentDamageHistory: [],
  odometerTimeline: [],
  serviceHistory: [],
  listingEvidence: {
    listingUrl: '',
    source: '',
    askingPrice: null,
    mileage: null,
    photos: [],
    dealer: null,
    location: null,
    history: []
  },
  marketComps: [],
  pricingContext: {
    askingPrice: null,
    estimatedRangeLow: null,
    estimatedRangeHigh: null,
    position: ''
  },
  buyerRecommendation: {
    verdict: '',
    rationale: '',
    nextSteps: [],
    sellerQuestions: [],
    discrepancyNotes: []
  },
  provenance: [],
  gating: {
    free: [],
    paid: [],
    providerDependent: []
  }
};
