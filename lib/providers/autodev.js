const AUTODEV_BASE = 'https://auto.dev/api';

export async function getAutoDevListingSnapshot({ vin }) {
  return {
    provider: 'auto.dev',
    status: 'scaffolded',
    vin,
    note: 'Wire authenticated Auto.dev listing and photo endpoints here.'
  };
}
