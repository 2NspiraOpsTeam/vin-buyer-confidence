export function normalizeListingEvidence(snapshot = {}, fallback = {}) {
  const photoCandidates = Array.isArray(snapshot?.photos) ? snapshot.photos : Array.isArray(snapshot?.photoUrls) ? snapshot.photoUrls : [];
  return {
    listingUrl: snapshot?.listingUrl || fallback.listingUrl || '',
    source: snapshot?.provider || fallback.source || 'unknown',
    photoSource: snapshot?.photoSource || fallback.photoSource || snapshot?.provider || fallback.source || 'unknown',
    photoStatus: snapshot?.photoStatus || fallback.photoStatus || (photoCandidates.length ? 'photos_available' : 'not_available'),
    photoNote: snapshot?.photoNote || fallback.photoNote || '',
    askingPrice: snapshot?.askingPrice ?? fallback.askingPrice ?? null,
    mileage: snapshot?.mileage ?? fallback.mileage ?? null,
    photos: photoCandidates,
    dealer: snapshot?.dealer || null,
    location: snapshot?.location || null
  };
}

export function normalizeMarketComps(items = []) {
  return items.map(item => {
    const source = item.source || item.provider || 'unknown';
    const isDemo = Boolean(item.isDemo || item.demo || source.includes('preview'));
    const listingUrl = item.listingUrl || item.vdpUrl || '';
    return {
      vin: item.vin || '',
      title: item.title || '',
      price: item.price ?? null,
      mileage: item.mileage ?? null,
      photo: item.photo || item.thumbnail || '',
      listingUrl: isDemo && listingUrl.includes('example.com') ? '' : listingUrl,
      dealer: item.dealer || null,
      location: item.location || null,
      source,
      isDemo,
      confidence: isDemo ? 'demo_placeholder_not_live_market_evidence' : 'provider_backed'
    };
  });
}
