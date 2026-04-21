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
    note: 'Authenticated MarketCheck integration point is ready for endpoint wiring.',
    listingUrl: '',
    askingPrice: null,
    mileage: null,
    photos: [],
    dealer: null,
    location: null,
    comps: []
  };
}

export function mapMarketCheckPreview({ vin, askingPrice = null, mileage = null, listingUrl = '' }) {
  return {
    provider: 'marketcheck',
    vin,
    listingUrl,
    askingPrice,
    mileage,
    photos: [
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'
    ],
    dealer: 'Sample dealer',
    location: 'New York, NY',
    comps: [
      {
        vin: 'SAMPLECOMP001',
        title: '2018 BMW 330i xDrive',
        price: 27995,
        mileage: 58420,
        photo: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80',
        listingUrl: 'https://example.com/comp-1',
        dealer: 'Metro European Cars',
        location: 'White Plains, NY',
        source: 'marketcheck-preview'
      },
      {
        vin: 'SAMPLECOMP002',
        title: '2018 BMW 330i xDrive',
        price: 29150,
        mileage: 51200,
        photo: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        listingUrl: 'https://example.com/comp-2',
        dealer: 'North Jersey Imports',
        location: 'Paramus, NJ',
        source: 'marketcheck-preview'
      }
    ]
  };
}
