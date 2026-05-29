export function normalizeIdentity(nhtsaRow) {
  const errorCode = String(nhtsaRow?.ErrorCode || '').trim();
  const errorText = String(nhtsaRow?.ErrorText || '').trim();
  const warnings = errorText && errorCode !== '0'
    ? errorText.split(';').map(item => item.trim().replace(/^\d+\s*-\s*/, '')).filter(Boolean)
    : [];
  const hasCoreIdentity = Boolean(nhtsaRow?.Make && nhtsaRow?.Model && nhtsaRow?.ModelYear);
  const confidence = errorCode && errorCode !== '0'
    ? 'needs_verification'
    : hasCoreIdentity
      ? 'confirmed'
      : 'partial';

  return {
    vin: nhtsaRow?.VIN || nhtsaRow?.vin || '',
    year: nhtsaRow?.ModelYear || '',
    make: nhtsaRow?.Make || '',
    model: nhtsaRow?.Model || '',
    trim: nhtsaRow?.Trim || nhtsaRow?.Series || '',
    source: 'nhtsa',
    confidence,
    bodyClass: nhtsaRow?.BodyClass || '',
    vehicleType: nhtsaRow?.VehicleType || '',
    driveType: nhtsaRow?.DriveType || '',
    engineCylinders: nhtsaRow?.EngineCylinders || '',
    displacementL: nhtsaRow?.DisplacementL || '',
    fuelTypePrimary: nhtsaRow?.FuelTypePrimary || '',
    plantCountry: nhtsaRow?.PlantCountry || '',
    manufacturer: nhtsaRow?.Manufacturer || '',
    baseMsrp: nhtsaRow?.BasePrice || '',
    nhtsaDecode: {
      errorCode,
      errorText,
      isClean: errorCode === '0',
      warnings,
      source: 'NHTSA VPIC DecodeVinValues'
    }
  };
}
