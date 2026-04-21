export function normalizeIdentity(nhtsaRow) {
  return {
    vin: nhtsaRow?.VIN || nhtsaRow?.vin || '',
    year: nhtsaRow?.ModelYear || '',
    make: nhtsaRow?.Make || '',
    model: nhtsaRow?.Model || '',
    trim: nhtsaRow?.Trim || nhtsaRow?.Series || '',
    source: 'nhtsa',
    confidence: nhtsaRow?.Make && nhtsaRow?.Model && nhtsaRow?.ModelYear ? 'confirmed' : 'partial'
  };
}
