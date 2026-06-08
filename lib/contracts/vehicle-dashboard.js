export const VEHICLE_DASHBOARD_CONTRACT = {
  vehicleIdentity: {
    vin: '',
    year: '',
    make: '',
    model: '',
    trim: '',
    source: '',
    confidence: '',
    nhtsaDecode: {
      errorCode: '',
      errorText: '',
      isClean: false,
      warnings: [],
      source: ''
    }
  },
  nhtsaRawDecode: {},
  recallSignals: [],
  safetyRatings: {
    overall: null,
    frontal: null,
    side: null,
    rollover: null,
    source: '',
    confidence: ''
  },
  safetyEquipment: {
    abs: '',
    esc: '',
    airbags: {}
  },
  reviewsSummary: {
    expertSummary: '',
    ownerSummary: '',
    commonPros: [],
    commonCons: [],
    sourceStatus: ''
  },
  ownershipSummary: {
    ownerCount: null,
    currentTitleState: '',
    useTypes: []
  },
  historySource: {
    provider: '',
    status: '',
    note: '',
    ownerPrivacyNote: ''
  },
  ownershipTimeline: [],
  registrationTimeline: [],
  titleHistory: [],
  accidentDamageHistory: [],
  insuranceClaims: [],
  damagePhotoEvidence: [],
  auctionEvidence: [],
  odometerTimeline: [],
  serviceHistory: [],
  listingEvidence: {
    listingUrl: '',
    source: '',
    photoSource: '',
    photoStatus: '',
    photoNote: '',
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
