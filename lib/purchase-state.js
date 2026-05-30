import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const PURCHASES = new Map();

function normalizeSessionId(sessionId) {
  return typeof sessionId === 'string' ? sessionId.trim() : '';
}

function getStateFilePath() {
  const filePath = process.env.PURCHASE_STATE_FILE;
  return typeof filePath === 'string' && filePath.trim() ? filePath.trim() : '';
}

function readFileState(filePath) {
  if (!filePath || !existsSync(filePath)) return {};

  try {
    const raw = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn(JSON.stringify({
      type: 'purchase_state_read_failed',
      filePath,
      error: error.message || 'Unable to read purchase state'
    }));
    return {};
  }
}

function writeFileState(filePath, state) {
  if (!filePath) return;

  mkdirSync(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(tempPath, filePath);
}

export function savePurchase(record) {
  const sessionId = normalizeSessionId(record?.sessionId);
  if (!sessionId) return null;
  const savedRecord = {
    ...record,
    sessionId,
    savedAt: new Date().toISOString()
  };

  PURCHASES.set(sessionId, savedRecord);

  const filePath = getStateFilePath();
  if (filePath) {
    const state = readFileState(filePath);
    state[sessionId] = savedRecord;
    writeFileState(filePath, state);
  }

  return savedRecord;
}

export function getPurchase(sessionId) {
  const normalizedSessionId = normalizeSessionId(sessionId);
  if (!normalizedSessionId) return null;
  const memoryRecord = PURCHASES.get(normalizedSessionId);
  if (memoryRecord) return memoryRecord;

  const filePath = getStateFilePath();
  if (!filePath) return null;

  const state = readFileState(filePath);
  const fileRecord = state[normalizedSessionId] || null;
  if (fileRecord) PURCHASES.set(normalizedSessionId, fileRecord);
  return fileRecord;
}
