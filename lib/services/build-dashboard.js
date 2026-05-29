import { VEHICLE_DASHBOARD_CONTRACT } from '../contracts/vehicle-dashboard.js';
import { getNhtsaIdentity, getNhtsaRecalls } from '../providers/nhtsa.js';
import { getMarketCheckListingSnapshot, mapMarketCheckPreview } from '../providers/marketcheck.js';
import { getAutoDevListingSnapshot, mapAutoDevPreview } from '../providers/autodev.js';
import { getMonroneySnapshot } from '../providers/monroney.js';
import { getVehicleHistorySnapshot } from '../providers/history.js';
import { normalizeIdentity } from '../normalize/identity.js';
import { normalizeRecalls } from '../normalize/recalls.js';
import { normalizeHistorySnapshot } from '../normalize/history.js';
import { normalizeListingEvidence, normalizeMarketComps } from '../normalize/listings.js';
import { estimateMarketValue } from './estimate-market-value.js';

function isPreviewableStatus(status) {
  return status === 'scaffolded' || status === 'configured_not_called' || status === 'configured_error';
}

function dedupeBy(items = [], getKey = item => item) {
  const seen = new Set();
  return items.filter(item => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getNhtsaWarnings(nhtsaIdentity) {
  const errorCode = String(nhtsaIdentity?.ErrorCode || '').trim();
  const errorText = String(nhtsaIdentity?.ErrorText || '').trim();
  const warnings = errorText && errorCode !== '0'
    ? errorText.split(';').map(item => item.trim().replace(/^\d+\s*-\s*/, '')).filter(Boolean)
    : [];

  return {
    errorCode,
    errorText,
    isClean: errorCode === '0',
    warnings,
    hasWarning: Boolean(errorCode && errorCode !== '0')
  };
}

function buildRecommendation({ valuation, recalls = [], marketComps = [], listingEvidence, nhtsaIdentity }) {
  const discrepancyNotes = [];
  const nextSteps = [];
  const sellerQuestions = [];
  const nhtsaDecode = getNhtsaWarnings(nhtsaIdentity);
  const liveMarketComps = marketComps.filter(comp => !comp.isDemo);

  if (nhtsaDecode.hasWarning) {
    discrepancyNotes.push(`NHTSA VIN decode warning: ${nhtsaDecode.warnings[0] || `ErrorCode ${nhtsaDecode.errorCode}`}.`);
    nextSteps.push('Verify the VIN against the windshield, title, registration, seller listing, and vehicle photos before relying on this result.');
    sellerQuestions.push('Can you confirm the VIN from the windshield plate and send a close-up photo?');
  }

  if (recalls.length > 0) {
    discrepancyNotes.push(`${recalls.length} reported recall record(s) found.`);
    nextSteps.push('Check whether open recalls have already been repaired.');
    sellerQuestions.push('Have the recall repairs been completed, and do you have proof?');
  }

  if (valuation.position === 'high') {
    discrepancyNotes.push('Current asking price appears above the scaffolded market midpoint.');
    nextSteps.push('Use comparable listings to negotiate before placing a deposit.');
    sellerQuestions.push('What justifies the asking price versus similar listings?');
  }

  if (!listingEvidence?.photos?.length) {
    discrepancyNotes.push('Listing photo coverage is limited or unavailable from current providers.');
    nextSteps.push('Request a fresh walkaround, interior photos, and cold-start video.');
    sellerQuestions.push('Can you send updated photos and a cold-start video?');
  }

  if (!liveMarketComps.length) {
    discrepancyNotes.push('No live provider-backed market comps are connected yet; preview comps are demo placeholders only.');
    nextSteps.push('Connect a live comps provider before treating pricing guidance as market evidence.');
  }

  const verdict = nhtsaDecode.hasWarning || valuation.position === 'high' || recalls.length > 0 ? 'verify_further' : 'pursue';
  const rationale = nhtsaDecode.hasWarning
    ? 'NHTSA returned a decode warning. Verify the VIN against the windshield, title, registration, and seller listing before relying on this result.'
    : verdict === 'verify_further'
    ? 'Core identity is available, but VIN, pricing, recall, and/or provider signals still need verification before committing.'
    : 'Core identity looks coherent and no immediate pricing or recall blocker stands out.';

  return {
    verdict,
    rationale,
    nextSteps: dedupeBy(nextSteps, item => item),
    sellerQuestions: dedupeBy(sellerQuestions, item => item),
    discrepancyNotes: dedupeBy(discrepancyNotes, item => item)
  };
}

export async function buildVehicleDashboard({ vin, askingPrice = null, mileage = null, listingUrl = '', condition = 'good' }) {
  const [nhtsaIdentity, recallRows, marketcheckRaw, autodevRaw, monroney, historyRaw] = await Promise.all([
    getNhtsaIdentity(vin),
    getNhtsaRecalls(vin),
    getMarketCheckListingSnapshot({ vin }),
    getAutoDevListingSnapshot({ vin }),
    getMonroneySnapshot({ vin }),
    getVehicleHistorySnapshot({ vin })
  ]);

  const marketcheck = isPreviewableStatus(marketcheckRaw?.status)
    ? mapMarketCheckPreview({ vin, askingPrice, mileage, listingUrl })
    : marketcheckRaw;

  const autodev = isPreviewableStatus(autodevRaw?.status)
    ? mapAutoDevPreview({ vin, askingPrice, mileage, listingUrl })
    : autodevRaw;

  const mergedPhotos = dedupeBy(
    [...(marketcheck?.photos || []), ...(autodev?.photos || [])],
    item => item
  );

  const mergedComps = dedupeBy(
    [...(marketcheck?.comps || []), ...(autodev?.comps || [])],
    item => item?.vin || item?.listingUrl || item?.title
  );

  const valuation = estimateMarketValue({ askingPrice, mileage, condition });
  const normalizedListingEvidence = normalizeListingEvidence(
    {
      ...marketcheck,
      ...autodev,
      photos: mergedPhotos,
      listingUrl: autodev?.listingUrl || marketcheck?.listingUrl || listingUrl,
      askingPrice: autodev?.askingPrice ?? marketcheck?.askingPrice ?? askingPrice,
      mileage: autodev?.mileage ?? marketcheck?.mileage ?? mileage,
      provider: autodev?.status === 'live' ? 'auto.dev' : marketcheck?.provider || autodev?.provider || 'unknown'
    },
    { listingUrl, askingPrice, mileage, source: 'provider_merge' }
  );
  const normalizedMarketComps = normalizeMarketComps(mergedComps);
  const buyerRecommendation = buildRecommendation({
    valuation,
    recalls: recallRows,
    marketComps: normalizedMarketComps,
    listingEvidence: normalizedListingEvidence,
    nhtsaIdentity
  });
  const liveMarketComps = normalizedMarketComps.filter(comp => !comp.isDemo);
  const normalizedHistory = normalizeHistorySnapshot(historyRaw);
  const nhtsaDecode = getNhtsaWarnings(nhtsaIdentity);
  const hasCoreIdentity = Boolean(nhtsaIdentity?.Make && nhtsaIdentity?.Model && nhtsaIdentity?.ModelYear);
  const resultConfidence = {
    identity: nhtsaDecode.hasWarning
      ? 'Needs VIN verification'
      : hasCoreIdentity && nhtsaDecode.isClean
        ? 'High identity confidence'
        : 'Limited identity confidence',
    market: liveMarketComps.length
      ? 'Provider-backed market confidence'
      : 'Limited market confidence',
    nhtsaDecode
  };

  return {
    ...VEHICLE_DASHBOARD_CONTRACT,
    vehicleIdentity: normalizeIdentity(nhtsaIdentity),
    recallSignals: normalizeRecalls(recallRows),
    safetyRatings: {
      overall: null,
      frontal: null,
      side: null,
      rollover: null,
      source: 'nhtsa_scaffold',
      confidence: 'not_yet_matched'
    },
    safetyEquipment: {
      abs: nhtsaIdentity?.ABS || '',
      esc: nhtsaIdentity?.ElectronicStabilityControl || '',
      airbags: {
        front: nhtsaIdentity?.AirBagLocFront || '',
        side: nhtsaIdentity?.AirBagLocSide || '',
        curtain: nhtsaIdentity?.AirBagLocCurtain || ''
      }
    },
    reviewsSummary: {
      expertSummary: 'Structured review module scaffold. Licensed expert-review source not connected yet.',
      ownerSummary: 'Structured owner-sentiment module scaffold. Licensed review source not connected yet.',
      commonPros: [],
      commonCons: [],
      sourceStatus: 'not_connected'
    },
    listingEvidence: normalizedListingEvidence,
    marketComps: normalizedMarketComps,
    resultConfidence,
    pricingContext: {
      askingPrice,
      condition: valuation.condition,
      estimatedRangeLow: valuation.estimatedRangeLow,
      estimatedRangeHigh: valuation.estimatedRangeHigh,
      midpoint: valuation.midpoint,
      position: valuation.position,
      negotiationRoom: valuation.negotiationRoom,
      confidence: liveMarketComps.length ? valuation.confidence : 'limited_no_live_comps',
      adjustmentSummary: valuation.adjustmentSummary
    },
    ownershipSummary: normalizedHistory.ownershipSummary,
    historySource: {
      provider: normalizedHistory.provider,
      status: normalizedHistory.status,
      note: normalizedHistory.note,
      ownerPrivacyNote: normalizedHistory.ownerPrivacyNote
    },
    ownershipTimeline: normalizedHistory.ownershipTimeline,
    registrationTimeline: normalizedHistory.registrationTimeline,
    titleHistory: [...normalizedHistory.titleHistory, monroney].filter(Boolean),
    accidentDamageHistory: normalizedHistory.accidentDamageHistory,
    odometerTimeline: normalizedHistory.odometerTimeline,
    serviceHistory: normalizedHistory.serviceHistory,
    buyerRecommendation,
    provenance: [
      { source: 'nhtsa', status: 'live' },
      { source: 'marketcheck', status: marketcheckRaw?.status || 'scaffolded' },
      { source: 'auto.dev', status: autodevRaw?.status || 'scaffolded' },
      { source: 'monroneylabels', status: monroney?.status || 'scaffolded' },
      { source: 'vehicle-history', status: historyRaw?.status || 'not_configured' }
    ],
    gating: {
      free: ['vehicleIdentity', 'recallSignals'],
      paid: ['ownershipTimeline', 'registrationTimeline', 'titleHistory', 'accidentDamageHistory', 'odometerTimeline', 'serviceHistory', 'marketComps', 'pricingContext', 'buyerRecommendation', 'safetyRatings', 'reviewsSummary'],
      providerDependent: ['ownershipTimeline', 'registrationTimeline', 'titleHistory', 'accidentDamageHistory', 'odometerTimeline', 'serviceHistory', 'listingEvidence', 'marketComps', 'safetyRatings', 'reviewsSummary']
    }
  };
}
