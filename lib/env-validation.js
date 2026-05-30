export function isValidAppBaseUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}
