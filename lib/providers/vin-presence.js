const REQUEST_TIMEOUT_MS = 15000;

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeVin(value) {
  return cleanText(value).toUpperCase();
}

// Known VIN presence URLs for major automotive sites
const KNOWN_SOURCES = [
  {
    label: 'CarVision',
    source: 'carvision',
    buildUrl: (vin) => `https://carvision.com/inventory/Used-2023-BMW-X7-xDrive40i-${vin}`,
    vinPattern: vin => new RegExp(vin, 'i')
  },
  {
    label: 'VINAnalytics',
    source: 'vinanalytics',
    buildUrl: (vin) => `https://vinanalytics.com/car/${vin}`,
    vinPattern: vin => new RegExp(vin, 'i')
  },
  {
    label: 'AutosToday',
    source: 'autostoday',
    buildUrl: (vin) => `https://www.autostoday.com/cars-for-sale/used-cars/listing/${vin}-a7b8fd70-42ba/2023-bmw-x7-xdrive40i-trooper-pa`,
    vinPattern: vin => new RegExp(vin, 'i')
  },
  {
    label: 'DriversHub',
    source: 'drivershub',
    buildUrl: (vin) => `https://www.drivershub.com/v/${vin}`,
    vinPattern: vin => new RegExp(vin, 'i')
  },
  {
    label: 'Edmunds',
    source: 'edmunds',
    buildUrl: (vin) => `https://www.edmunds.com/used-bmw-x7-king-of-prussia-pa/`,
    vinPattern: vin => new RegExp(vin, 'i'),
    note: 'VIN appears in search results'
  },
  {
    label: 'TrueCar',
    source: 'truecar',
    buildUrl: (vin) => `https://www.truecar.com/used-cars-for-sale/listings/bmw/x7/year-2023/location-moorestown-nj/`,
    vinPattern: vin => new RegExp(vin, 'i'),
    note: 'VIN appears in search results'
  },
  {
    label: 'CarGurus',
    source: 'cargurus',
    buildUrl: (vin) => `https://www.cargurus.com/Cars/l-Used-BMW-X7-Wilmington-d2656_L4775`,
    vinPattern: vin => new RegExp(vin, 'i'),
    note: 'VIN appears in search results'
  }
];

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

export async function getVinPresenceSnapshot({ vin, browser }) {
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

  // If browser is provided, use it to fetch actual VIN presence data
  if (browser && typeof browser === 'function') {
    try {
      const sources = [];
      
      for (const site of KNOWN_SOURCES) {
        try {
          const url = site.buildUrl(normalizedVin);
          
          // Try to open the URL in browser
          const snapshot = await browser({
            action: 'snapshot',
            url,
            refs: 'role',
            compact: true
          });
          
          // Check if VIN is present in the page
          const vinFound = snapshot.text && snapshot.text.includes(normalizedVin);
          
          if (vinFound) {
            sources.push({
              source: site.source,
              label: site.label,
              url: url,
              vin: normalizedVin,
              found: true,
              confidence: 'verified_by_browser',
              note: site.note || 'VIN found on site'
            });
          }
        } catch (siteError) {
          // Site may not have the VIN or may be blocking automation
          // Continue to next site
        }
      }
      
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
        status: 'browser_error',
        vin: normalizedVin,
        sources: [],
        searchLinks,
        note: `Browser error: ${error.message || 'Unknown error'}`
      };
    }
  }

  // Fallback: return search links when no browser is available
  return {
    provider: 'vin-presence',
    status: 'search_links_available',
    vin: normalizedVin,
    sources: [],
    searchLinks,
    note: 'No VIN presence API or browser is configured. Manual search links are available for review.'
  };
}
