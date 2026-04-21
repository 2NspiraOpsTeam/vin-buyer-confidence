const PURCHASES = new Map();

export function savePurchase(record) {
  if (!record?.sessionId) return null;
  PURCHASES.set(record.sessionId, {
    ...record,
    savedAt: new Date().toISOString()
  });
  return PURCHASES.get(record.sessionId);
}

export function getPurchase(sessionId) {
  if (!sessionId) return null;
  return PURCHASES.get(sessionId) || null;
}
