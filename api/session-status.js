import { getPurchase } from '../lib/purchase-state.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const rawSessionId = req.query?.session_id;
  const sessionId = typeof rawSessionId === 'string' ? rawSessionId.trim() : '';
  if (!sessionId) {
    return res.status(400).json({ ok: false, error: 'session_id is required' });
  }

  const record = getPurchase(sessionId);
  return res.status(200).json({ ok: true, found: Boolean(record), record: record || null });
}
