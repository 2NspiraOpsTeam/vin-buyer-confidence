function cleanText(value) {
  return String(value || '').trim();
}

function getEnv(name) {
  return cleanText(process.env[name]);
}

function normalizeVin(value) {
  return cleanText(value).toUpperCase();
}

function buildQuery({ vin, year = '', make = '', model = '' }) {
  return [vin, year, make, model, 'photos']
    .map(cleanText)
    .filter(Boolean)
    .join(' ');
}

export function buildWebPhotoSearchLinks({ vin, year = '', make = '', model = '' }) {
  const normalizedVin = normalizeVin(vin);
  const query = buildQuery({ vin: normalizedVin, year, make, model });
  const encodedQuery = encodeURIComponent(query);

  return [
    {
      label: '🔍 Search web images by VIN',
      source: 'bing-images',
      url: `https://www.bing.com/images/search?q=${encodedQuery}`,
      note: 'Manual review required before treating images as evidence.'
    },
    {
      label: '🔍 Search Google Images by VIN',
      source: 'google-images',
      url: `https://www.google.com/search?tbm=isch&q=${encodedQuery}`,
      note: 'Manual review required before treating images as evidence.'
    }
  ];
}

function normalizePhotoResult(item = {}) {
  const imageUrl = cleanText(item.imageUrl || item.image || item.thumbnailUrl || item.thumbnail || item.url);
  const sourceUrl = cleanText(item.sourceUrl || item.contextUrl || item.pageUrl || item.hostPageUrl || item.webSearchUrl || item.url);
  if (!imageUrl) return null;

  return {
    imageUrl,
    thumbnailUrl: cleanText(item.thumbnailUrl || item.thumbnail || imageUrl),
    sourceUrl,
    title: cleanText(item.title || item.name || 'Web photo result'),
    source: cleanText(item.source || item.provider || 'web-image-search'),
    confidence: 'web_search_candidate'
  };
}

function normalizeSearchResponse(payload) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.photos)
      ? payload.photos
      : Array.isArray(payload?.images)
        ? payload.images
        : Array.isArray(payload?.value)
          ? payload.value
          : Array.isArray(payload?.results)
            ? payload.results
            : [];

  return items.map(normalizePhotoResult).filter(Boolean).slice(0, 12);
}

export async function getWebPhotoSearchSnapshot({ vin, year = '', make = '', model = '' }) {
  const normalizedVin = normalizeVin(vin);
  const searchLinks = buildWebPhotoSearchLinks({ vin: normalizedVin, year, make, model });

  if (!normalizedVin || normalizedVin.length !== 17) {
    return {
      provider: 'web-photo-search',
      status: 'invalid_vin',
      vin: normalizedVin,
      photos: [],
      searchLinks,
      note: 'A valid 17-character VIN is required for web photo lookup.'
    };
  }

  const webImageSearchApiUrl = getEnv('WEB_IMAGE_SEARCH_API_URL');
  const webImageSearchApiKey = getEnv('WEB_IMAGE_SEARCH_API_KEY');

  if (!webImageSearchApiUrl || !webImageSearchApiKey) {
    return {
      provider: 'web-photo-search',
      status: 'search_links_available',
      vin: normalizedVin,
      photos: [],
      searchLinks,
      note: 'No web image search API is configured. Manual web photo search links are available.'
    };
  }

  try {
    const url = new URL(webImageSearchApiUrl);
    url.searchParams.set('q', buildQuery({ vin: normalizedVin, year, make, model }));
    url.searchParams.set('vin', normalizedVin);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${webImageSearchApiKey}`
      }
    });
    const payload = await response.json();
    if (!response.ok) {
      return {
        provider: 'web-photo-search',
        status: 'configured_error',
        vin: normalizedVin,
        photos: [],
        searchLinks,
        note: payload?.error || payload?.message || `Web image search failed with ${response.status}`
      };
    }

    const photos = normalizeSearchResponse(payload);
    return {
      provider: 'web-photo-search',
      status: photos.length ? 'web_images_found' : 'no_web_images_found',
      vin: normalizedVin,
      photos,
      searchLinks,
      note: photos.length
        ? 'Web image search candidates found. Verify each source before relying on images as vehicle evidence.'
        : 'Web image search completed but returned no image candidates.'
    };
  } catch (error) {
    return {
      provider: 'web-photo-search',
      status: 'configured_error',
      vin: normalizedVin,
      photos: [],
      searchLinks,
      note: error.message || 'Web image search failed.'
    };
  }
}
