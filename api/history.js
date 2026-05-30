import { getVehicleHistorySnapshot } from '../lib/providers/history.js';
import { normalizeHistorySnapshot } from '../lib/normalize/history.js';
import { getProviderConfigStatus } from '../lib/provider-readiness.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const vin = (req.query?.vin || '').trim().toUpperCase();
  if (!vin || vin.length < 11) {
    return res.status(400).json({ ok: false, error: 'Valid VIN required' });
  }

  try {
    const snapshot = await getVehicleHistorySnapshot({ vin });
    const history = normalizeHistorySnapshot(snapshot);
    const vehicleHistoryConfigStatus = getProviderConfigStatus('vehicleHistory');
    const auctionEvidenceConfigStatus = getProviderConfigStatus('auctionEvidence');
    return res.status(200).json({
      ok: true,
      history,
      integrationStatus: {
        vehicleHistory: vehicleHistoryConfigStatus === 'configured'
          ? history.status
          : vehicleHistoryConfigStatus,
        auctionEvidence: auctionEvidenceConfigStatus === 'partial' || auctionEvidenceConfigStatus === 'invalid_config'
          ? auctionEvidenceConfigStatus
          : history.auctionEvidenceSource?.status || auctionEvidenceConfigStatus
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'History lookup failed' });
  }
}
