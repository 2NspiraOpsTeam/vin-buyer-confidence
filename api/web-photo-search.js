import { getWebPhotoSearchSnapshot } from '../lib/providers/web-photo-search.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const vin = String(req.query?.vin || '').trim().toUpperCase();
  if (!vin || vin.length !== 17) {
    return res.status(400).json({ ok: false, error: 'Valid 17-character VIN required' });
  }

  try {
    const snapshot = await getWebPhotoSearchSnapshot({
      vin,
      year: req.query?.year || '',
      make: req.query?.make || '',
      model: req.query?.model || ''
    });
    return res.status(200).json({ ok: true, ...snapshot });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Web photo search failed' });
  }
}
