export function normalizeListingEvidence(snapshot = {}, fallback = {}) {
  const photoCandidates = Array.isArray(snapshot?.photos) ? snapshot.photos : Array.isArray(snapshot?.photoUrls) ? snapshot.photoUrls : [];
  return {
    listingUrl: snapshot?.listingUrl || fallback.listingUrl || '',
    source: snapshot?.provider || fallback.source || 'unknown',
    askingPrice: snapshot?.askingPrice ?? fallback.askingPrice ?? null,
    mileage: snapshot?.mileage ?? fallback.mileage ?? null,
    photos: photoCandidates,
    dealer: snapshot?.dealer || null,
    location: snapshot?.location || null
  };
}

export function normalizeMarketComps(items = []) {
  return items.map(item => ({
    vin: item.vin || '',
    title: item.title || '',
    price: item.price ?? null,
    mileage: item.mileage ?? null,
    photo: item.photo || item.thumbnail || '',
    listingUrl: item.listingUrl || item.vdpUrl || '',
    dealer: item.dealer || null,
    location: item.location || null,
    source: item.source || item.provider || 'unknown'
  }));
}
