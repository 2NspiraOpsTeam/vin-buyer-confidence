const AUCTION_EVIDENCE_API_URL = process.env.AUCTION_EVIDENCE_API_URL || '';
const AUCTION_EVIDENCE_API_KEY = process.env.AUCTION_EVIDENCE_API_KEY || '';

const PUBLIC_INDEXED_AUCTION_FIXTURES = {
  WBAJA7C57JWA72863: [
    {
      provider: 'public_indexed_archive',
      platform: 'IAAI',
      lotId: '39153564',
      vin: 'WBAJA7C57JWA72863',
      year: '2018',
      make: 'BMW',
      model: '530i xDrive',
      seller: 'Geico Insurance',
      auctionDate: '2024-04-30',
      location: 'Long Island, NY',
      saleDocument: 'NY MV-907A',
      lossType: 'Collision',
      primaryDamage: 'Front & rear',
      secondaryDamage: '',
      odometer: 71019,
      runCondition: 'Run and Drive',
      keysPresent: true,
      actualCashValue: 16356,
      estimatedRepairCost: 21408,
      photoCount: 16,
      photoUrls: [
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121954930033.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121954741183.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121954164904.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121954100764.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121954188419.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121954334995.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121954309629.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121954496490.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121955422531.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121955407904.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121954765571.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121955231723.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121955353926.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121955815213.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121955587257.jpg',
        'https://s2.autohelperbot.com/WBAJA7C57JWA72863-1714121955941346.jpg'
      ],
      photoEvidenceUrl: 'https://bid.cars/en/lot/0-39153564/2018-BMW-5-Series-WBAJA7C57JWA72863',
      secondarySourceUrl: 'https://autohelperbot.com/en/car/WBAJA7C57JWA72863_51567399',
      confidence: 'public_indexed_evidence',
      note: 'Public indexed auction archive evidence. Confirm with a licensed auction/history provider before treating as authoritative.'
    }
  ]
};

export async function getAuctionEvidenceSnapshot({ vin }) {
  const normalizedVin = String(vin || '').trim().toUpperCase();

  if (AUCTION_EVIDENCE_API_URL && AUCTION_EVIDENCE_API_KEY) {
    try {
      const url = new URL(AUCTION_EVIDENCE_API_URL);
      url.searchParams.set('vin', normalizedVin);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${AUCTION_EVIDENCE_API_KEY}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          provider: 'auction-evidence',
          status: 'configured_error',
          vin: normalizedVin,
          note: data?.error || data?.message || `Auction evidence request failed with ${response.status}`,
          auctionEvidence: []
        };
      }

      return {
        provider: data?.provider || 'auction-evidence',
        status: 'live',
        vin: normalizedVin,
        note: data?.note || 'Auction evidence provider connected.',
        auctionEvidence: data?.auctionEvidence || data?.auctionRecords || data?.records || []
      };
    } catch (error) {
      return {
        provider: 'auction-evidence',
        status: 'configured_error',
        vin: normalizedVin,
        note: error.message || 'Auction evidence lookup failed',
        auctionEvidence: []
      };
    }
  }

  const fixtureRecords = PUBLIC_INDEXED_AUCTION_FIXTURES[normalizedVin] || [];
  return {
    provider: 'auction-evidence',
    status: fixtureRecords.length ? 'public_indexed_match' : 'not_configured',
    vin: normalizedVin,
    note: fixtureRecords.length
      ? 'Public indexed auction evidence matched this VIN. A licensed provider should verify and enrich the record.'
      : 'No auction evidence provider is connected yet.',
    auctionEvidence: fixtureRecords
  };
}
