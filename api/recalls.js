export default async function handler(req, res) {
  try {
    const vin = (req.query.vin || '').trim().toUpperCase();
    if (!vin || vin.length < 11) {
      res.status(400).json({ error: 'Valid VIN required' });
      return;
    }

    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${encodeURIComponent(vin)}`;
    const response = await fetch(url);
    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      ok: true,
      vin,
      count: results.length,
      recalls: results.slice(0, 10).map(item => ({
        recallNumber: item.NHTSACampaignNumber || '',
        reportReceivedDate: item.ReportReceivedDate || '',
        component: item.Component || '',
        summary: item.Summary || '',
        consequence: item.Conequence || item.Consequence || '',
        remedy: item.Remedy || ''
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Recall lookup failed', detail: String(error) });
  }

}
