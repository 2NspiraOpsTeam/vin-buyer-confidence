const MARKETCHECK_BASE = 'https://api.marketcheck.com/v2';

export async function getMarketCheckListingSnapshot({ vin }) {
  return {
    provider: 'marketcheck',
    status: 'scaffolded',
    vin,
    note: 'Wire authenticated MarketCheck listing search or VIN detail here.'
  };
}
