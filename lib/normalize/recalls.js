export function normalizeRecalls(rows = []) {
  return rows.map(item => ({
    recallNumber: item.NHTSACampaignNumber || '',
    component: item.Component || '',
    summary: item.Summary || '',
    consequence: item.Conequence || item.Consequence || '',
    remedy: item.Remedy || '',
    source: 'nhtsa'
  }));
}
