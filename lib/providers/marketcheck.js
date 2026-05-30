const MARKETCHECK_BASE = 'https://api.marketcheck.com/v2';
const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY || '';

export async function getMarketCheckListingSnapshot({ vin }) {
  if (!MARKETCHECK_API_KEY) {
    console.warn('MarketCheck API Key missing. Returning scaffolded data.');
    return {
      provider: 'marketcheck',
      status: 'scaffolded',
      vin,
      note: 'Missing MARKETCHECK_API_KEY. To activate, set the MARKETCHECK_API_KEY environment variable.'
    };
  }

  try {
    // Assuming MarketCheck has an endpoint for listing data/comps by VIN
    const url = `${MARKETCHECK_BASE}/listings/by-vin?vin=${encodeURIComponent(vin)}&api_key=${MARKETCHECK_API_KEY}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });

    if (!response.ok) {
      throw new Error(`MarketCheck API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Placeholder mapping assuming data contains listings and comps arrays
    const listings = data.listings || [];
    const comps = data.comps || [];

    return {
      provider: 'marketcheck',
      status: 'live',
      vin,
      note: 'Successfully fetched live data from MarketCheck API.',
      listingUrl: listings[0]?.vdpUrl || '', // Assuming first listing is the main one
      askingPrice: listings[0]?.askingPrice || null,
      mileage: listings[0]?.mileage || null,
      photos: listings.map(l => l.imageUrl || 'fallback_url'),
      dealer: listings[0]?.dealer || null,
      location: listings[0]?.location || null,
      comps: comps
    };
  } catch (error) {
    console.error('Error fetching MarketCheck data:', error);
    // Return a failure status but keep the object structure consistent
    return {
      provider: 'marketcheck',
      status: 'error',
      vin,
      note: `Failed to fetch data: ${error.message}`,
      listingUrl: '',
      askingPrice: null,
      mileage: null,
      photos: [],
      dealer: null,
      location: null,
      comps: []
    };
  }
}

export function mapMarketCheckPreview({ vin, askingPrice = null, mileage = null, listingUrl = '' }) {
  return {
    provider: 'marketcheck',
    vin,
    listingUrl,
    askingPrice,
    mileage,
    photos: [],
    dealer: 'Sample dealer',
    location: 'New York, NY',
    comps: [
      {
        vin: 'SAMPLECOMP001',
        title: '2018 BMW 330i xDrive',
        price: 27995,
        mileage: 58420,
        photo: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80',
        listingUrl: '',
        dealer: 'Metro European Cars',
        location: 'White Plains, NY',
        source: 'marketcheck-preview',
        isDemo: true
      },
      {
        vin: 'SAMPLECOMP002',
        title: '2018 BMW 330i xDrive',
        price: 29150,
        mileage: 51200,
        photo: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        listingUrl: '',
        dealer: 'North Jersey Imports',
        location: 'Paramus, NJ',
        source: 'marketcheck-preview',
        isDemo: true
      }
    ]
  };
}
