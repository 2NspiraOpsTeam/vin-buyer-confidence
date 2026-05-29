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

export function normalizeHistorySnapshot(snapshot = {}) {
  const status = snapshot?.status || 'not_configured';
  const ownershipSummary = snapshot?.ownershipSummary || {};

  return {
    provider: snapshot?.provider || 'vehicle-history',
    status,
    note: snapshot?.note || '',
    ownerPrivacyNote: snapshot?.ownerPrivacyNote || 'Prior owner names and addresses should not be displayed in buyer-facing reports. Show owner count, state, title, registration, and usage signals instead.',
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
    odometerTimeline: toArray(snapshot?.odometerTimeline).map(item => normalizeEvent(item, 'odometer')),
    serviceHistory: toArray(snapshot?.serviceHistory).map(item => normalizeEvent(item, 'service'))
  };
}
