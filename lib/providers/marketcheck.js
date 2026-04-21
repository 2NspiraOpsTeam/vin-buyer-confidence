const MARKETCHECK_BASE = 'https://api.marketcheck.com/v2';
const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY || '';

export async function getMarketCheckListingSnapshot({ vin }) {
  if (!MARKETCHECK_API_KEY) {
    return {
      provider: 'marketcheck',
      status: 'scaffolded',
      vin,
      note: 'Missing MARKETCHECK_API_KEY'
    };
  }

  return {
    provider: 'marketcheck',
    status: 'configured_not_called',
    vin,
    note: 'Authenticated MarketCheck integration point is ready for endpoint wiring.'
  };
}

export function mapMarketCheckPreview({ vin, askingPrice = null, mileage = null, listingUrl = '' }) {
  return {
    provider: 'marketcheck',
    vin,
    listingUrl,
    askingPrice,
    mileage,
    photos: [],
    dealer: null,
    location: null,
    comps: []
  };
}
