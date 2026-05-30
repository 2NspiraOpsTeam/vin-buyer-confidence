export const PROVIDER_CONFIGS = [
  { name: 'marketcheck', required: ['MARKETCHECK_API_KEY'] },
  { name: 'autodev', required: ['AUTODEV_API_KEY'] },
  {
    name: 'vehicleHistory',
    required: ['VEHICLE_HISTORY_API_URL', 'VEHICLE_HISTORY_API_KEY'],
    urlEnv: ['VEHICLE_HISTORY_API_URL']
  },
  {
    name: 'auctionEvidence',
    required: ['AUCTION_EVIDENCE_API_URL', 'AUCTION_EVIDENCE_API_KEY'],
    urlEnv: ['AUCTION_EVIDENCE_API_URL']
  }
];

function present(name) {
  return typeof process.env[name] === 'string' && process.env[name].trim().length > 0;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function getProviderReadiness(configs = PROVIDER_CONFIGS) {
  return configs.reduce((summary, config) => {
    const configured = config.required.filter(present);
    const invalidFormat = (config.urlEnv || []).filter(name => present(name) && !isValidHttpUrl(process.env[name]));

    if (configured.length === config.required.length && invalidFormat.length === 0) {
      summary.ready.push(config.name);
    } else if (configured.length > 0 || invalidFormat.length > 0) {
      summary.partial.push({
        name: config.name,
        configured,
        missing: config.required.filter(name => !present(name)),
        invalidFormat
      });
    }
    return summary;
  }, { ready: [], partial: [] });
}

export function getProviderConfigStatus(name) {
  const readiness = getProviderReadiness();
  if (readiness.ready.includes(name)) return 'configured';
  const partial = readiness.partial.find(provider => provider.name === name);
  if (partial?.invalidFormat?.length) return 'invalid_config';
  if (partial) return 'partial';
  return 'not_configured';
}
