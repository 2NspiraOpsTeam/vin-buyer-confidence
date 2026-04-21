import { getPurchase } from '../lib/purchase-state.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const sessionId = req.query?.session_id;
  if (!sessionId) {
    return res.status(400).json({ ok: false, error: 'session_id is required' });
  }

  const record = getPurchase(sessionId);
  return res.status(200).json({ ok: true, found: Boolean(record), record: record || null });
}
