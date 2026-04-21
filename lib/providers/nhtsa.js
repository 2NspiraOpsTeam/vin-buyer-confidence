export async function getNhtsaIdentity(vin) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
  const response = await fetch(url);
  const data = await response.json();
  return data?.Results?.[0] || null;
}

export async function getNhtsaRecalls(vin) {
  const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${encodeURIComponent(vin)}`;
  const response = await fetch(url);
  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}
