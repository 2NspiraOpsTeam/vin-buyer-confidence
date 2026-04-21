export async function getMonroneySnapshot({ vin }) {
  return {
    provider: 'monroneylabels',
    status: 'scaffolded',
    vin,
    note: 'Wire authenticated MonroneyLabels sticker/build lookup here.'
  };
}
