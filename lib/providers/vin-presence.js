const REQUEST_TIMEOUT_MS = 10000;

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeVin(value) {
  return cleanText(value).toUpperCase();
}

function buildVinPresenceQuery(vin) {
  // Search for the VIN on popular automotive sites
  return [
    `VIN:${vin} site:carvision.com`,
    `VIN:${vin} site:vinanalytics.com`,
    `VIN:${vin} site:autostoday.com`,
    `VIN:${vin} site:edmunds.com`,
    `VIN:${vin} site:drivershub.com`,
    `VIN:${vin} site:cars.com`,
    `VIN:${vin} site:autotrader.com`,
    `VIN:${vin} site:facebook.com`,
    `VIN:${vin} site:craigslist.org`
  ];
}

export function buildVinPresenceLinks({ vin }) {
  const normalizedVin = normalizeVin(vin);
  const encodedVin = encodeURIComponent(normalizedVin);

  return [
    {
      label: 'Search CarVision by VIN',
      source: 'carvision-search',
      url: `https://www.carvision.com/search/?q=${encodedVin}`,
      note: 'Public vehicle listing search.'
    },
    {
      label: 'Search VINAnalytics by VIN',
      source: 'vinanalytics-search',
      url: `https://vinanalytics.com/car/${encodedVin}`,
      note: 'VIN decode and history lookup.'
    },
    {
      label: 'Search AutoToday by VIN',
      source: 'autostoday-search',
      url: `https://www.autostoday.com/used-cars/search/?vin=${encodedVin}`,
      note: 'Used car listings search.'
    },
    {
      label: 'Search Edmunds by VIN',
      source: 'edmunds-search',
      url: `https://www.edmunds.com/cars-for-sale/used/${encodedVin}`,
      note: 'Used car listings and pricing.'
    },
    {
      label: 'Search DriversHub by VIN',
      source: 'drivershub-search',
      url: `https://www.drivershub.com/search?q=${encodedVin}`,
      note: 'Vehicle listing and history platform.'
    },
    {
      label: 'Search Facebook Marketplace by VIN',
      source: 'facebook-search',
      url: `https://www.facebook.com/marketplace/search/?query=${encodedVin}`,
      note: 'Local seller listings.'
    },
    {
      label: 'Search Craigslist by VIN',
      source: 'craigslist-search',
      url: `https://craigslist.org/search/cta?query=${encodedVin}`,
      note: 'Local classified listings.'
    }
  ];
}

export async function getVinPresenceSnapshot({ vin }) {
  const normalizedVin = normalizeVin(vin);

  if (!normalizedVin || normalizedVin.length !== 17) {
    return {
      provider: 'vin-presence',
      status: 'invalid_vin',
      vin: normalizedVin,
      sources: [],
      searchLinks: [],
      note: 'A valid 17-character VIN is required for VIN presence check.'
    };
  }

  const searchLinks = buildVinPresenceLinks({ vin: normalizedVin });

  const vinPresenceApiUrl = process.env.VIN_PRESENCE_API_URL;
  const vinPresenceApiKey = process.env.VIN_PRESENCE_API_KEY;

  if (!vinPresenceApiUrl || !vinPresenceApiKey) {
    return {
      provider: 'vin-presence',
      status: 'search_links_available',
      vin: normalizedVin,
      sources: [],
      searchLinks,
      note: 'No VIN presence API is configured. Manual search links are available for review.'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const query = buildVinPresenceQuery(normalizedVin);
    const url = new URL(vinPresenceApiUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('vin', normalizedVin);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${vinPresenceApiKey}`
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        provider: 'vin-presence',
        status: 'configured_error',
        vin: normalizedVin,
        sources: [],
        searchLinks,
        note: `VIN presence API returned ${response.status}`
      };
    }

    const payload = await response.json();
    const sources = normalizeVinPresenceResponse(payload);

    return {
      provider: 'vin-presence',
      status: sources.length ? 'vin_found' : 'vin_not_found',
      vin: normalizedVin,
      sources,
      searchLinks,
      note: sources.length
        ? `VIN found on ${sources.length} external source(s). Verify each source before relying on the data.`
        : 'VIN presence check completed but no external sources were found.'
    };
  } catch (error) {
    return {
      provider: 'vin-presence',
      status: 'configured_error',
      vin: normalizedVin,
      sources: [],
      searchLinks,
      note: error.name === 'AbortError' ? 'VIN presence check timed out.' : error.message || 'VIN presence check failed.'
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeVinPresenceResponse(payload) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.sources)
      ? payload.sources
      : Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

  return items.map(item => ({
    source: cleanText(item.source || item.provider || 'unknown'),
    url: cleanText(item.url || item.link || item.href || ''),
    title: cleanText(item.title || item.name || item.headline || 'VIN listing'),
    vin: cleanText(item.vin || item.vehicleVin || ''),
    make: cleanText(item.make || item.brand || ''),
    model: cleanText(item.model || item.vehicleModel || ''),
    year: cleanText(item.year || item.modelYear || ''),
    price: item.price != null ? Number(item.price) : null,
    mileage: item.mileage != null ? Number(item.mileage) : null,
    condition: cleanText(item.condition || ''),
    listingUrl: cleanText(item.listingUrl || item.listingUrl || ''),
    foundAt: cleanText(item.foundAt || item.timestamp || ''),
    confidence: 'web_search_candidate'
  })).filter(item => item.url && item.source).slice(0, 20);
}
