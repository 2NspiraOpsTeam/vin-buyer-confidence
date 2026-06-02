import { buildVehicleDashboard } from '../lib/services/build-dashboard.js';
import { getProviderConfigStatus } from '../lib/provider-readiness.js';

function parseOptionalNonNegativeNumber(value) {
  if (value == null || value === '') return { ok: true, value: null };
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? { ok: true, value: parsed }
    : { ok: false, value: null };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const vin = (req.query?.vin || '').trim().toUpperCase();
  const listingUrl = req.query?.listing_url || '';
  const askingPrice = parseOptionalNonNegativeNumber(req.query?.asking_price);
  const mileage = parseOptionalNonNegativeNumber(req.query?.mileage);
  const condition = req.query?.condition || 'good';

  if (!vin || vin.length < 11) {
    return res.status(400).json({ ok: false, error: 'Valid VIN required' });
  }

  if (!askingPrice.ok) {
    return res.status(400).json({ ok: false, error: 'asking_price must be a non-negative number' });
  }

  if (!mileage.ok) {
    return res.status(400).json({ ok: false, error: 'mileage must be a non-negative number' });
  }

  try {
    // Pass browser to buildVehicleDashboard for VIN presence verification
    const dashboard = await buildVehicleDashboard({
      vin,
      askingPrice: askingPrice.value,
      mileage: mileage.value,
      listingUrl,
      condition
    });
    const marketcheckConfigStatus = getProviderConfigStatus('marketcheck');
    const autodevConfigStatus = getProviderConfigStatus('autodev');
    const vehicleHistoryConfigStatus = getProviderConfigStatus('vehicleHistory');
    const auctionEvidenceConfigStatus = getProviderConfigStatus('auctionEvidence');
    const vinPresenceConfigStatus = getProviderConfigStatus('vinPresence');
    const auctionEvidenceStatus = dashboard.provenance?.find(item => item.source === 'auction-evidence')?.status;
    const listingPageStatus = dashboard.provenance?.find(item => item.source === 'listing-page')?.status || 'not_provided';
    const vinPresenceStatus = dashboard.provenance?.find(item => item.source === 'vin-presence')?.status || 'not_configured';
    return res.status(200).json({
      ok: true,
      dashboard,
      integrationStatus: {
        marketcheck: marketcheckConfigStatus,
        autodev: autodevConfigStatus,
        listingPage: listingPageStatus,
        vehicleHistory: vehicleHistoryConfigStatus === 'configured'
          ? dashboard.historySource?.status || 'configured'
          : vehicleHistoryConfigStatus,
        auctionEvidence: auctionEvidenceConfigStatus === 'configured'
          ? auctionEvidenceStatus || 'configured'
          : auctionEvidenceConfigStatus === 'partial' || auctionEvidenceConfigStatus === 'invalid_config'
            ? auctionEvidenceConfigStatus
            : auctionEvidenceStatus || 'not_configured',
        vinPresence: vinPresenceConfigStatus === 'configured'
          ? vinPresenceStatus || 'configured'
          : vinPresenceConfigStatus === 'partial' || vinPresenceConfigStatus === 'invalid_config'
            ? vinPresenceConfigStatus
            : vinPresenceStatus || 'not_configured'
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Dashboard build failed' });
  }
}
