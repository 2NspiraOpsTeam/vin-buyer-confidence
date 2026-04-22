const AUTODEV_BASE = 'https://api.auto.dev';
const AUTODEV_API_KEY = process.env.AUTODEV_API_KEY || '';

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AUTODEV_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const json = await response.json();
  if (!response.ok) {
    return { ok: false, status: response.status, error: json?.error || 'Auto.dev request failed', raw: json };
  }
  return { ok: true, data: json?.data || json };
}

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

  const [listingRes, photosRes] = await Promise.all([
    fetchJson(`${AUTODEV_BASE}/listings/${encodeURIComponent(vin)}`),
    fetchJson(`${AUTODEV_BASE}/photos/${encodeURIComponent(vin)}`)
  ]);

  if (!listingRes.ok && !photosRes.ok) {
    return {
      provider: 'auto.dev',
      status: 'configured_error',
      vin,
      note: listingRes.error || photosRes.error || 'Auto.dev fetch failed',
      listingUrl: '',
      askingPrice: null,
      mileage: null,
      photos: [],
      dealer: null,
      location: null,
      comps: []
    };
  }

  const listing = listingRes.ok ? listingRes.data : {};
  const retailPhotos = photosRes.ok ? (photosRes.data?.retail || []) : [];
  const vehicle = listing?.vehicle || {};
  const dealerName = listing?.dealer?.name || listing?.seller?.name || null;
  const locationText = listing?.dealer?.city && listing?.dealer?.state ? `${listing.dealer.city}, ${listing.dealer.state}` : null;
  const primaryPrice = listing?.price ?? listing?.pricing?.price ?? null;
  const primaryMileage = vehicle?.mileage ?? listing?.mileage ?? null;
  const listingUrl = listing?.vdpUrl || listing?.@id || '';

  return {
    provider: 'auto.dev',
    status: 'live',
    vin,
    note: 'Auto.dev listing and photos connected',
    listingUrl,
    askingPrice: primaryPrice,
    mileage: primaryMileage,
    photos: retailPhotos,
    dealer: dealerName,
    location: locationText,
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
