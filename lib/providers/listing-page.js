const MAX_HTML_BYTES = 600000;
const REQUEST_TIMEOUT_MS = 5000;

function normalizeListingUrl(listingUrl) {
  if (typeof listingUrl !== 'string' || !listingUrl.trim()) return null;

  try {
    const url = new URL(listingUrl.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;

    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function resolveImageUrl(candidate, baseUrl) {
  try {
    const raw = decodeHtml(candidate).trim();
    if (!raw || raw.startsWith('data:')) return '';
    return new URL(raw, baseUrl).toString();
  } catch {
    return '';
  }
}

function extractMetaImages(html, baseUrl) {
  const images = [];
  const metaPattern = /<meta\b[^>]*(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?|image)["'][^>]*>/gi;
  const contentPattern = /\bcontent=["']([^"']+)["']/i;
  const linkPattern = /<link\b[^>]*rel=["'](?:image_src|preload)["'][^>]*>/gi;
  const hrefPattern = /\bhref=["']([^"']+)["']/i;

  for (const match of html.matchAll(metaPattern)) {
    const content = match[0].match(contentPattern)?.[1];
    const resolved = resolveImageUrl(content, baseUrl);
    if (resolved) images.push(resolved);
  }

  for (const match of html.matchAll(linkPattern)) {
    const href = match[0].match(hrefPattern)?.[1];
    const resolved = resolveImageUrl(href, baseUrl);
    if (resolved) images.push(resolved);
  }

  return images;
}

function collectJsonLdImages(value, images = []) {
  if (!value || images.length >= 16) return images;

  if (typeof value === 'string') {
    const resolved = resolveImageUrl(value, 'https://example.com/');
    if (resolved) images.push(value);
    return images;
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectJsonLdImages(item, images));
    return images;
  }

  if (typeof value === 'object') {
    if (value.image) collectJsonLdImages(value.image, images);
    if (value.photo) collectJsonLdImages(value.photo, images);
    if (value.thumbnailUrl) collectJsonLdImages(value.thumbnailUrl, images);
    if (value.contentUrl) collectJsonLdImages(value.contentUrl, images);
  }

  return images;
}

function extractJsonLdImages(html, baseUrl) {
  const images = [];
  const scriptPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]).trim());
      collectJsonLdImages(parsed, images);
    } catch {
      // Ignore invalid JSON-LD. Many listing pages include partial or malformed blocks.
    }
  }

  return images.map(image => resolveImageUrl(image, baseUrl)).filter(Boolean);
}

function extractLikelyVehicleImages(html, baseUrl) {
  const images = [];
  const imagePattern = /<img\b[^>]*(?:src|data-src|data-original|data-lazy)=["']([^"']+)["'][^>]*>/gi;

  for (const match of html.matchAll(imagePattern)) {
    const tag = match[0].toLowerCase();
    if (!/(vehicle|inventory|listing|vdp|gallery|photo|image|carousel|swiper)/.test(tag)) continue;
    const resolved = resolveImageUrl(match[1], baseUrl);
    if (resolved) images.push(resolved);
  }

  return images;
}

export function extractListingImagesFromHtml(html, baseUrl) {
  const boundedHtml = String(html || '').slice(0, MAX_HTML_BYTES);
  return unique([
    ...extractMetaImages(boundedHtml, baseUrl),
    ...extractJsonLdImages(boundedHtml, baseUrl),
    ...extractLikelyVehicleImages(boundedHtml, baseUrl)
  ]).slice(0, 16);
}

export async function getListingPageSnapshot({ listingUrl }) {
  const url = normalizeListingUrl(listingUrl);
  if (!url) {
    return {
      provider: 'listing-page',
      status: listingUrl ? 'invalid_listing_url' : 'not_provided',
      listingUrl: listingUrl || '',
      photos: [],
      note: listingUrl ? 'Listing URL is missing, private, or not http(s).' : 'No listing URL provided.'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'VinBuyerConfidenceBot/1.0'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('text/html')) {
      return {
        provider: 'listing-page',
        status: 'listing_fetch_unavailable',
        listingUrl: url.toString(),
        photos: [],
        note: `Listing page did not return readable HTML (${response.status}).`
      };
    }

    const html = await response.text();
    const photos = extractListingImagesFromHtml(html, url);
    return {
      provider: 'listing-page',
      status: photos.length ? 'listing_images_found' : 'no_listing_images_found',
      listingUrl: url.toString(),
      photos,
      note: photos.length
        ? 'Listing page image metadata was found. Verify the images match the VIN and seller listing.'
        : 'No listing image metadata was found on the provided page.'
    };
  } catch (error) {
    return {
      provider: 'listing-page',
      status: 'listing_fetch_failed',
      listingUrl: url.toString(),
      photos: [],
      note: error.name === 'AbortError' ? 'Listing page image lookup timed out.' : error.message || 'Listing page image lookup failed.'
    };
  } finally {
    clearTimeout(timeout);
  }
}
