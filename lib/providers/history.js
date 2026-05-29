import { getAuctionEvidenceSnapshot } from './auction-evidence.js';

const VEHICLE_HISTORY_API_URL = process.env.VEHICLE_HISTORY_API_URL || '';
const VEHICLE_HISTORY_API_KEY = process.env.VEHICLE_HISTORY_API_KEY || '';

export async function getVehicleHistorySnapshot({ vin }) {
  const auctionEvidenceSnapshot = await getAuctionEvidenceSnapshot({ vin });

  if (!VEHICLE_HISTORY_API_URL || !VEHICLE_HISTORY_API_KEY) {
    return {
      provider: 'vehicle-history',
      status: auctionEvidenceSnapshot.status === 'public_indexed_match' ? 'partial_public_evidence' : 'not_configured',
      vin,
      note: 'No licensed vehicle history provider is connected yet.',
      ownerPrivacyNote: 'Prior owner names and addresses are not available in buyer-facing reports. Use owner count, ownership periods, state/title events, and usage type instead.',
      auctionEvidenceSource: {
        provider: auctionEvidenceSnapshot.provider,
        status: auctionEvidenceSnapshot.status,
        note: auctionEvidenceSnapshot.note
      },
      ownershipSummary: {
        ownerCount: null,
        currentTitleState: null,
        useTypes: []
      },
      ownershipTimeline: [],
      registrationTimeline: [],
      titleHistory: [],
      accidentDamageHistory: [],
      insuranceClaims: [],
      damagePhotoEvidence: [],
      auctionEvidence: auctionEvidenceSnapshot.auctionEvidence || [],
      odometerTimeline: [],
      serviceHistory: []
    };
  }

  try {
    const url = new URL(VEHICLE_HISTORY_API_URL);
    url.searchParams.set('vin', vin);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${VEHICLE_HISTORY_API_KEY}`
      }
    });
    const data = await response.json();

    if (!response.ok) {
      return {
        provider: 'vehicle-history',
        status: 'configured_error',
        vin,
        note: data?.error || data?.message || `Vehicle history request failed with ${response.status}`,
        raw: data
      };
    }

    return {
      provider: data?.provider || 'vehicle-history',
      status: 'live',
      vin,
      raw: data,
      auctionEvidenceSource: {
        provider: auctionEvidenceSnapshot.provider,
        status: auctionEvidenceSnapshot.status,
        note: auctionEvidenceSnapshot.note
      },
      ownershipSummary: data?.ownershipSummary || data?.owners || {},
      ownershipTimeline: data?.ownershipTimeline || data?.ownership || [],
      registrationTimeline: data?.registrationTimeline || data?.registrations || [],
      titleHistory: data?.titleHistory || data?.titles || [],
      accidentDamageHistory: data?.accidentDamageHistory || data?.accidents || data?.damage || [],
      insuranceClaims: data?.insuranceClaims || data?.claims || data?.totalLossClaims || [],
      damagePhotoEvidence: data?.damagePhotoEvidence || data?.damagePhotos || data?.auctionPhotos || data?.salvagePhotos || [],
      auctionEvidence: [
        ...(data?.auctionEvidence || data?.auctionRecords || []),
        ...(auctionEvidenceSnapshot.auctionEvidence || [])
      ],
      odometerTimeline: data?.odometerTimeline || data?.odometer || data?.mileage || [],
      serviceHistory: data?.serviceHistory || data?.services || data?.maintenance || []
    };
  } catch (error) {
    return {
      provider: 'vehicle-history',
      status: 'configured_error',
      vin,
      note: error.message || 'Vehicle history lookup failed'
    };
  }
}
