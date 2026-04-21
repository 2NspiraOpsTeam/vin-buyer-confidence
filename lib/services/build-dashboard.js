import { VEHICLE_DASHBOARD_CONTRACT } from '../contracts/vehicle-dashboard.js';
import { getNhtsaIdentity, getNhtsaRecalls } from '../providers/nhtsa.js';
import { getMarketCheckListingSnapshot, mapMarketCheckPreview } from '../providers/marketcheck.js';
import { getAutoDevListingSnapshot } from '../providers/autodev.js';
import { getMonroneySnapshot } from '../providers/monroney.js';
import { normalizeIdentity } from '../normalize/identity.js';
import { normalizeRecalls } from '../normalize/recalls.js';
import { normalizeListingEvidence, normalizeMarketComps } from '../normalize/listings.js';
import { estimateMarketValue } from './estimate-market-value.js';

export async function buildVehicleDashboard({ vin, askingPrice = null, mileage = null, listingUrl = '', condition = 'good' }) {
  const [nhtsaIdentity, recallRows, marketcheckRaw, autodev, monroney] = await Promise.all([
    getNhtsaIdentity(vin),
    getNhtsaRecalls(vin),
    getMarketCheckListingSnapshot({ vin }),
    getAutoDevListingSnapshot({ vin }),
    getMonroneySnapshot({ vin })
  ]);

  const marketcheck = marketcheckRaw?.status === 'scaffolded' || marketcheckRaw?.status === 'configured_not_called'
    ? mapMarketCheckPreview({ vin, askingPrice, mileage, listingUrl })
    : marketcheckRaw;

  const valuation = estimateMarketValue({ askingPrice, mileage, condition });

  return {
    ...VEHICLE_DASHBOARD_CONTRACT,
    vehicleIdentity: normalizeIdentity(nhtsaIdentity),
    recallSignals: normalizeRecalls(recallRows),
    safetyRatings: {
      overall: null,
      frontal: null,
      side: null,
      rollover: null,
      source: 'nhtsa_scaffold',
      confidence: 'not_yet_matched'
    },
    safetyEquipment: {
      abs: nhtsaIdentity?.ABS || '',
      esc: nhtsaIdentity?.ElectronicStabilityControl || '',
      airbags: {
        front: nhtsaIdentity?.AirBagLocFront || '',
        side: nhtsaIdentity?.AirBagLocSide || '',
        curtain: nhtsaIdentity?.AirBagLocCurtain || ''
      }
    },
    reviewsSummary: {
      expertSummary: 'Structured review module scaffold. Licensed expert-review source not connected yet.',
      ownerSummary: 'Structured owner-sentiment module scaffold. Licensed review source not connected yet.',
      commonPros: [],
      commonCons: [],
      sourceStatus: 'not_connected'
    },
    listingEvidence: normalizeListingEvidence(marketcheck?.status === 'configured_not_called' ? marketcheck : { ...marketcheck, ...{ listingUrl, askingPrice, mileage } }, { listingUrl, askingPrice, mileage, source: marketcheck?.provider || 'marketcheck' }),
    marketComps: normalizeMarketComps(marketcheck?.comps || []),
    pricingContext: {
      askingPrice,
      condition: valuation.condition,
      estimatedRangeLow: valuation.estimatedRangeLow,
      estimatedRangeHigh: valuation.estimatedRangeHigh,
      midpoint: valuation.midpoint,
      position: valuation.position,
      negotiationRoom: valuation.negotiationRoom,
      confidence: valuation.confidence,
      adjustmentSummary: valuation.adjustmentSummary
    },
    ownershipTimeline: [],
    registrationTimeline: [],
    titleHistory: [marketcheck, autodev, monroney],
    accidentDamageHistory: [],
    odometerTimeline: [],
    serviceHistory: [],
    buyerRecommendation: {
      verdict: 'not_generated',
      rationale: 'Infrastructure scaffold only. Recommendation layer to be added after provider wiring.',
      nextSteps: ['Wire listing providers', 'Add pricing/comps normalization', 'Add recommendation engine'],
      sellerQuestions: [],
      discrepancyNotes: []
    },
    provenance: [
      { source: 'nhtsa', status: 'live' },
      { source: 'marketcheck', status: 'scaffolded' },
      { source: 'auto.dev', status: 'scaffolded' },
      { source: 'monroneylabels', status: 'scaffolded' }
    ],
    gating: {
      free: ['vehicleIdentity', 'recallSignals'],
      paid: ['ownershipTimeline', 'registrationTimeline', 'titleHistory', 'accidentDamageHistory', 'odometerTimeline', 'serviceHistory', 'marketComps', 'pricingContext', 'buyerRecommendation', 'safetyRatings', 'reviewsSummary'],
      providerDependent: ['ownershipTimeline', 'registrationTimeline', 'titleHistory', 'accidentDamageHistory', 'odometerTimeline', 'serviceHistory', 'listingEvidence', 'marketComps', 'safetyRatings', 'reviewsSummary']
    }
  };
}
