const AUTODEV_BASE = 'https://api.auto.dev';
const AUTODEV_API_KEY = process.env.AUTODEV_API_KEY || '';

export async function getAutoDevListingSnapshot({ vin }) {
  if (!AUTODEV_API_KEY) {
    return {
      provider: 'auto.dev',
      status: 'scaffolded',
      vin,
      note: 'Missing AUTODEV_API_KEY',
      listingUrl: '',
      askingPrice: null,
      mileage: null,
      photos: [],
      dealer: null,
      location: null,
      comps: []
    };
  }

  return {
    provider: 'auto.dev',
    status: 'configured_not_called',
    vin,
    note: 'Authenticated Auto.dev integration point is ready for endpoint wiring.',
    listingUrl: '',
    askingPrice: null,
    mileage: null,
    photos: [],
    dealer: null,
    location: null,
    comps: []
  };
}

export function mapAutoDevPreview({ vin, askingPrice = null, mileage = null, listingUrl = '' }) {
  return {
    provider: 'auto.dev',
    vin,
    listingUrl,
    askingPrice,
    mileage,
    photos: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
    ],
    dealer: 'Sample listing partner',
    location: 'Brooklyn, NY',
    comps: [
      {
        vin: 'AUTODEVCOMP001',
        title: '2018 BMW 530i xDrive',
        price: 28950,
        mileage: 68810,
        photo: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=900&q=80',
        listingUrl: 'https://example.com/autodev-comp-1',
        dealer: 'Cityline Motors',
        location: 'Queens, NY',
        source: 'auto.dev-preview'
      },
      {
        vin: 'AUTODEVCOMP002',
        title: '2018 BMW 530i xDrive',
        price: 30125,
        mileage: 64500,
        photo: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=900&q=80',
        listingUrl: 'https://example.com/autodev-comp-2',
        dealer: 'North Shore Autos',
        location: 'Long Island, NY',
        source: 'auto.dev-preview'
      }
    ]
  };
}
