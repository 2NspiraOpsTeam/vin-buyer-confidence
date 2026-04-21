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
    condition: 'good',
    estimatedRangeLow: null,
    estimatedRangeHigh: null,
    midpoint: null,
    position: '',
    negotiationRoom: null,
    confidence: '',
    adjustmentSummary: {
      mileageAdjustment: 0,
      conditionAdjustment: 0
    }
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
