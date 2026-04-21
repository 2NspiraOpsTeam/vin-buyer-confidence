import { VEHICLE_DASHBOARD_CONTRACT } from '../contracts/vehicle-dashboard.js';
import { getNhtsaIdentity, getNhtsaRecalls } from '../providers/nhtsa.js';
import { getMarketCheckListingSnapshot } from '../providers/marketcheck.js';
import { getAutoDevListingSnapshot } from '../providers/autodev.js';
import { getMonroneySnapshot } from '../providers/monroney.js';
import { normalizeIdentity } from '../normalize/identity.js';
import { normalizeRecalls } from '../normalize/recalls.js';

export async function buildVehicleDashboard({ vin, askingPrice = null, mileage = null, listingUrl = '' }) {
  const [nhtsaIdentity, recallRows, marketcheck, autodev, monroney] = await Promise.all([
    getNhtsaIdentity(vin),
    getNhtsaRecalls(vin),
    getMarketCheckListingSnapshot({ vin }),
    getAutoDevListingSnapshot({ vin }),
    getMonroneySnapshot({ vin })
  ]);

  return {
    ...VEHICLE_DASHBOARD_CONTRACT,
    vehicleIdentity: normalizeIdentity(nhtsaIdentity),
    recallSignals: normalizeRecalls(recallRows),
    listingEvidence: {
      listingUrl,
      source: marketcheck?.provider || 'marketcheck',
      askingPrice,
      mileage,
      photos: [],
      dealer: null,
      location: null
    },
    marketComps: [],
    pricingContext: {
      askingPrice,
      estimatedRangeLow: null,
      estimatedRangeHigh: null,
      position: 'not_yet_scored'
    },
    historySignals: [marketcheck, autodev, monroney],
    buyerRecommendation: {
      verdict: 'not_generated',
      rationale: 'Infrastructure scaffold only. Recommendation layer to be added after provider wiring.',
      nextSteps: ['Wire listing providers', 'Add pricing/comps normalization', 'Add recommendation engine']
    },
    provenance: [
      { source: 'nhtsa', status: 'live' },
      { source: 'marketcheck', status: 'scaffolded' },
      { source: 'auto.dev', status: 'scaffolded' },
      { source: 'monroneylabels', status: 'scaffolded' }
    ]
  };
}
