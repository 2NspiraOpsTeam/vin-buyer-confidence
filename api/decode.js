export default async function handler(req, res) {
  try {
    const vin = (req.query.vin || '').trim().toUpperCase();
    if (!vin || vin.length < 11) {
      res.status(400).json({ error: 'Valid VIN required' });
      return;
    }

    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
    const response = await fetch(url);
    const data = await response.json();
    const row = data?.Results?.[0] || {};

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
      plantCountry: row.PlantCountry || '',
      manufacturer: row.Manufacturer || '',
      abs: row.ABS || '',
      esc: row.ElectronicStabilityControl || '',
      airbags: {
        front: row.AirBagLocFront || '',
        side: row.AirBagLocSide || '',
        curtain: row.AirBagLocCurtain || ''
      },
      raw: row
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ ok: true, decoded });
  } catch (error) {
    res.status(500).json({ error: 'Decode failed', detail: String(error) });
  }

}
