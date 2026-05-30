export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const vin = (req.query?.vin || '').trim().toUpperCase();
    if (!vin || vin.length < 11) {
      res.status(400).json({ ok: false, error: 'Valid VIN required' });
      return;
    }

    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
    const response = await fetch(url);
    const data = await response.json();
    const row = data?.Results?.[0] || {};
    const nhtsaErrorCode = String(row.ErrorCode || '').trim();
    const nhtsaErrorText = String(row.ErrorText || '').trim();
    const nhtsaWarnings = nhtsaErrorText && nhtsaErrorCode !== '0'
      ? nhtsaErrorText.split(';').map(item => item.trim().replace(/^\d+\s*-\s*/, '')).filter(Boolean)
      : [];

    const decoded = {
      vin,
      make: row.Make || '',
      model: row.Model || '',
      modelYear: row.ModelYear || '',
      trim: row.Trim || '',
      series: row.Series || '',
      bodyClass: row.BodyClass || '',
      vehicleType: row.VehicleType || '',
      engineCylinders: row.EngineCylinders || '',
      displacementL: row.DisplacementL || '',
      driveType: row.DriveType || '',
      fuelTypePrimary: row.FuelTypePrimary || '',
      baseMsrp: row.BasePrice || '',
      plantCountry: row.PlantCountry || '',
      manufacturer: row.Manufacturer || '',
      abs: row.ABS || '',
      esc: row.ElectronicStabilityControl || '',
      airbags: {
        front: row.AirBagLocFront || '',
        side: row.AirBagLocSide || '',
        curtain: row.AirBagLocCurtain || ''
      },
      nhtsa: {
        errorCode: nhtsaErrorCode,
        errorText: nhtsaErrorText,
        isClean: nhtsaErrorCode === '0',
        warnings: nhtsaWarnings,
        source: 'NHTSA VPIC DecodeVinValues'
      },
      raw: row
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ ok: true, decoded });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Decode failed', detail: String(error) });
  }

}
