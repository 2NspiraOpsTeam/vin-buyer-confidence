import { buildVehicleDashboard } from '../lib/services/build-dashboard.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const vin = (req.query?.vin || '').trim().toUpperCase();
  const listingUrl = req.query?.listing_url || '';
  const askingPrice = req.query?.asking_price ? Number(req.query.asking_price) : null;
  const mileage = req.query?.mileage ? Number(req.query.mileage) : null;
  const condition = req.query?.condition || 'good';

  if (!vin || vin.length < 11) {
    return res.status(400).json({ ok: false, error: 'Valid VIN required' });
  }

  try {
    const dashboard = await buildVehicleDashboard({ vin, askingPrice, mileage, listingUrl, condition });
    return res.status(200).json({ ok: true, dashboard, integrationStatus: { marketcheck: process.env.MARKETCHECK_API_KEY ? 'configured' : 'not_configured' } });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Dashboard build failed' });
  }
}
