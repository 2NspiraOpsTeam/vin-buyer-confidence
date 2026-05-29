import { getVehicleHistorySnapshot } from '../lib/providers/history.js';
import { normalizeHistorySnapshot } from '../lib/normalize/history.js';

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
    return res.status(200).json({
      ok: true,
      history,
      integrationStatus: {
        vehicleHistory: process.env.VEHICLE_HISTORY_API_URL && process.env.VEHICLE_HISTORY_API_KEY
          ? history.status
          : 'not_configured',
        auctionEvidence: history.auctionEvidenceSource?.status || 'not_configured'
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'History lookup failed' });
  }
}
