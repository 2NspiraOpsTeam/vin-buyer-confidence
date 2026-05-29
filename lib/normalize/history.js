function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return value == null ? '' : String(value).trim();
}

function cleanMileage(value) {
  if (value == null || value === '') return null;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function normalizePhotoUrl(item) {
  if (typeof item === 'string') return cleanText(item);
  return cleanText(item?.url || item?.photoUrl || item?.imageUrl || item?.href || item?.src);
}

function normalizeEvent(item = {}, fallbackType = 'history') {
  return {
    date: cleanText(item.date || item.eventDate || item.titleDate || item.registrationDate || item.serviceDate),
    type: cleanText(item.type || item.recordType || fallbackType),
    state: cleanText(item.state || item.titleState || item.registrationState),
    source: cleanText(item.source || item.provider || item.reportingSource),
    description: cleanText(item.description || item.detail || item.event || item.note || item.summary),
    mileage: cleanMileage(item.mileage || item.odometer || item.odometerReading || item.VehicleOdometerReadingMeasure),
    confidence: cleanText(item.confidence || item.sourceConfidence || 'provider_reported')
  };
}

function normalizePhotoEvidence(item = {}) {
  return {
    date: cleanText(item.date || item.eventDate || item.auctionDate || item.photoDate),
    source: cleanText(item.source || item.provider || item.auction || item.reportingSource),
    type: cleanText(item.type || item.recordType || 'damage_photo'),
    damageType: cleanText(item.damageType || item.primaryDamage || item.damage || item.lossType),
    titleType: cleanText(item.titleType || item.titleStatus || item.saleDocument),
    url: cleanText(item.url || item.photoUrl || item.imageUrl || item.href),
    thumbnail: cleanText(item.thumbnail || item.thumbnailUrl || item.previewUrl),
    description: cleanText(item.description || item.detail || item.note || item.summary),
    confidence: cleanText(item.confidence || item.sourceConfidence || 'provider_reported')
  };
}

function normalizeAuctionEvidence(item = {}) {
  const photoUrls = toArray(item.photoUrls || item.photos || item.images || item.imageUrls)
    .map(normalizePhotoUrl)
    .filter(Boolean);

  return {
    provider: cleanText(item.provider || item.source || 'auction-evidence'),
    platform: cleanText(item.platform || item.auction || item.auctionPlatform),
    lotId: cleanText(item.lotId || item.lot || item.lotNumber),
    date: cleanText(item.auctionDate || item.date || item.saleDate),
    seller: cleanText(item.seller || item.sellerName),
    location: cleanText(item.location || item.branch || item.auctionLocation),
    saleDocument: cleanText(item.saleDocument || item.titleType || item.titleStatus),
    lossType: cleanText(item.lossType || item.loss || item.claimType),
    primaryDamage: cleanText(item.primaryDamage || item.damageType || item.damage),
    secondaryDamage: cleanText(item.secondaryDamage),
    odometer: cleanMileage(item.odometer || item.mileage || item.odometerReading),
    runCondition: cleanText(item.runCondition || item.startCode || item.startStatus),
    keysPresent: item.keysPresent ?? item.keys ?? null,
    actualCashValue: item.actualCashValue ?? item.acv ?? null,
    estimatedRepairCost: item.estimatedRepairCost ?? item.repairCost ?? item.erc ?? null,
    photoCount: item.photoCount ?? item.photosCount ?? (photoUrls.length || null),
    photoUrls,
    photoEvidenceUrl: cleanText(item.photoEvidenceUrl || item.url || item.href),
    secondarySourceUrl: cleanText(item.secondarySourceUrl || item.secondaryUrl),
    confidence: cleanText(item.confidence || 'provider_reported'),
    note: cleanText(item.note)
  };
}

export function normalizeHistorySnapshot(snapshot = {}) {
  const status = snapshot?.status || 'not_configured';
  const ownershipSummary = snapshot?.ownershipSummary || {};
  const auctionEvidence = toArray(snapshot?.auctionEvidence).map(normalizeAuctionEvidence);

  return {
    provider: snapshot?.provider || 'vehicle-history',
    status,
    note: snapshot?.note || '',
    ownerPrivacyNote: snapshot?.ownerPrivacyNote || 'Prior owner names and addresses should not be displayed in buyer-facing reports. Show owner count, state, title, registration, and usage signals instead.',
    auctionEvidenceSource: {
      provider: cleanText(snapshot?.auctionEvidenceSource?.provider || 'auction-evidence'),
      status: cleanText(snapshot?.auctionEvidenceSource?.status || ''),
      note: cleanText(snapshot?.auctionEvidenceSource?.note || '')
    },
    ownershipSummary: {
      ownerCount: ownershipSummary.ownerCount ?? ownershipSummary.count ?? null,
      currentTitleState: cleanText(ownershipSummary.currentTitleState || ownershipSummary.currentState),
      useTypes: toArray(ownershipSummary.useTypes || ownershipSummary.usageTypes).map(cleanText).filter(Boolean)
    },
    ownershipTimeline: toArray(snapshot?.ownershipTimeline).map(item => normalizeEvent(item, 'ownership')),
    registrationTimeline: toArray(snapshot?.registrationTimeline).map(item => normalizeEvent(item, 'registration')),
    titleHistory: toArray(snapshot?.titleHistory).map(item => normalizeEvent(item, 'title')),
    accidentDamageHistory: toArray(snapshot?.accidentDamageHistory).map(item => normalizeEvent(item, 'damage')),
    insuranceClaims: toArray(snapshot?.insuranceClaims).map(item => normalizeEvent(item, 'insurance_claim')),
    damagePhotoEvidence: toArray(snapshot?.damagePhotoEvidence).map(normalizePhotoEvidence),
    auctionEvidence,
    odometerTimeline: toArray(snapshot?.odometerTimeline).map(item => normalizeEvent(item, 'odometer')),
    serviceHistory: toArray(snapshot?.serviceHistory).map(item => normalizeEvent(item, 'service'))
  };
}
