const DEFAULT_OVERPASS_URLS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const HOTEL_TYPES = new Set(['hotel', 'hostel', 'guest_house', 'motel', 'apartment']);

const CATEGORY_FILTERS = {
  restaurants: '["amenity"~"restaurant|cafe|fast_food"]',
  hotels: '["tourism"~"hotel|hostel|guest_house|motel|apartment"]',
  attractions: '["tourism"~"attraction|museum|viewpoint|gallery|zoo"]',
};

export function buildOverpassQuery(category, center, radius = 6000) {
  const filter = CATEGORY_FILTERS[category];
  if (!filter) throw new TypeError('Unsupported OpenStreetMap category.');

  return `[out:json][timeout:18];
    nwr(around:${radius},${Number(center.lat).toFixed(5)},${Number(center.lng).toFixed(5)})${filter}["name"];
    out center tags 60;`;
}

export async function fetchOpenStreetMapPlaces({ category, center, signal }) {
  if (category === 'hotels') {
    try {
      const hotels = await fetchNominatimHotels(center, signal);
      if (hotels.length) return hotels;
    } catch (error) {
      if (signal.aborted) throw error;
    }
  }

  const query = buildOverpassQuery(category, center);
  const endpoints = configuredEndpoints();
  let lastError;

  for (const endpoint of endpoints) {
    try {
      const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(9000)]);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        signal: requestSignal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': 'TravelAdvisorByAlok/1.0',
        },
      });

      if (!response.ok) {
        lastError = new OpenStreetMapResponseError('OpenStreetMap request failed.', response.status);
        continue;
      }

      const payload = await response.json();
      const places = (Array.isArray(payload.elements) ? payload.elements : [])
        .map((element) => normalizeElement(element, category, center))
        .filter(Boolean)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 30);

      if (places.length) return places;
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return [];
}

export function buildNominatimHotelUrl(center, radiusKm = 6) {
  const latitudeDelta = radiusKm / 111;
  const longitudeScale = Math.max(Math.cos(center.lat * (Math.PI / 180)), 0.2);
  const longitudeDelta = radiusKm / (111 * longitudeScale);
  const params = new URLSearchParams({
    q: 'hotel',
    format: 'jsonv2',
    limit: '40',
    addressdetails: '1',
    extratags: '1',
    dedupe: '1',
    bounded: '1',
    viewbox: [
      center.lng - longitudeDelta,
      center.lat + latitudeDelta,
      center.lng + longitudeDelta,
      center.lat - latitudeDelta,
    ].map((value) => value.toFixed(5)).join(','),
  });

  return `${process.env.NOMINATIM_API_URL || DEFAULT_NOMINATIM_URL}?${params}`;
}

export function normalizeNominatimHotel(place, center) {
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  const type = String(place.type || place.addresstype || 'hotel');
  if (
    !place.osm_id
    || !place.name
    || !Number.isFinite(lat)
    || !Number.isFinite(lng)
    || !HOTEL_TYPES.has(type)
  ) return null;

  const extraTags = place.extratags ?? {};
  return {
    id: `osm-${place.osm_type || 'place'}-${place.osm_id}`,
    name: String(place.name),
    category: 'hotels',
    kind: formatLabel(type),
    lat,
    lng,
    address: String(place.display_name || 'Address not listed'),
    description: String(extraTags.description || ''),
    cuisine: [],
    openingHours: String(extraTags.opening_hours || ''),
    phone: String(extraTags.phone || extraTags['contact:phone'] || '').split(';')[0],
    website: safeUrl(extraTags.website || extraTags['contact:website']),
    distanceKm: distanceBetween(center, { lat, lng }),
    source: 'openstreetmap',
  };
}

export function normalizeElement(element, category, center) {
  const tags = element.tags ?? {};
  const lat = Number(element.lat ?? element.center?.lat);
  const lng = Number(element.lon ?? element.center?.lon);
  if (!tags.name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const address = tags['addr:full'] || [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:city'],
  ].filter(Boolean).join(' ');

  return {
    id: `osm-${element.type}-${element.id}`,
    name: String(tags.name),
    category,
    kind: formatLabel(tags.tourism || tags.amenity || category),
    lat,
    lng,
    address: address || 'Address not listed',
    description: String(tags.description || tags['description:en'] || ''),
    cuisine: tags.cuisine
      ? tags.cuisine.split(';').map(formatLabel).slice(0, 3)
      : [],
    openingHours: String(tags.opening_hours || ''),
    phone: String(tags.phone || tags['contact:phone'] || '').split(';')[0],
    website: safeUrl(tags.website || tags['contact:website']),
    distanceKm: distanceBetween(center, { lat, lng }),
    source: 'openstreetmap',
  };
}

export class OpenStreetMapResponseError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function fetchNominatimHotels(center, signal) {
  const response = await fetch(buildNominatimHotelUrl(center), {
    signal: AbortSignal.any([signal, AbortSignal.timeout(7000)]),
    headers: {
      Accept: 'application/json',
      'User-Agent': 'TravelAdvisorByAlok/1.0',
    },
  });

  if (!response.ok) {
    throw new OpenStreetMapResponseError('OpenStreetMap hotel search failed.', response.status);
  }

  const payload = await response.json();
  return (Array.isArray(payload) ? payload : [])
    .map((place) => normalizeNominatimHotel(place, center))
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 30);
}

function configuredEndpoints() {
  const configured = process.env.OVERPASS_API_URLS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return configured?.length ? configured : DEFAULT_OVERPASS_URLS;
}

function formatLabel(value) {
  return String(value)
    .replaceAll('_', ' ')
    .replaceAll(';', ' / ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value).startsWith('http') ? value : `https://${value}`);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function distanceBetween(origin, destination) {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const radiusKm = 6371;
  const latitudeDelta = toRadians(destination.lat - origin.lat);
  const longitudeDelta = toRadians(destination.lng - origin.lng);
  const originLatitude = toRadians(origin.lat);
  const destinationLatitude = toRadians(destination.lat);
  const value = (
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude)
    * Math.cos(destinationLatitude)
    * Math.sin(longitudeDelta / 2) ** 2
  );

  return radiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
