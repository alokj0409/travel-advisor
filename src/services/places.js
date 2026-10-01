const OVERPASS_URL = import.meta.env.VITE_OVERPASS_API_URL
  ?? 'https://overpass-api.de/api/interpreter';
const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL
  ?? 'https://nominatim.openstreetmap.org/search';

export const CATEGORIES = {
  restaurants: {
    label: 'Eat',
    heading: 'Places to eat',
    filter: '["amenity"~"restaurant|cafe|fast_food"]',
  },
  hotels: {
    label: 'Stay',
    heading: 'Places to stay',
    filter: '["tourism"~"hotel|hostel|guest_house|motel"]',
  },
  attractions: {
    label: 'Explore',
    heading: 'Things to explore',
    filter: '["tourism"~"attraction|museum|viewpoint|gallery|zoo"]',
  },
};

export function buildOverpassQuery(category, center, radius = 5000) {
  const definition = CATEGORIES[category] ?? CATEGORIES.restaurants;
  const latitude = Number(center.lat).toFixed(5);
  const longitude = Number(center.lng).toFixed(5);

  return `[out:json][timeout:20];
    nwr(around:${radius},${latitude},${longitude})${definition.filter}["name"];
    out center tags 60;`;
}

export async function fetchPlaces(category, center, signal) {
  try {
    const partnerPlaces = await fetchPartnerPlaces(category, center, signal);
    if (partnerPlaces.length) return partnerPlaces;
  } catch (error) {
    if (error.name === 'AbortError') throw error;
  }

  return fetchOpenStreetMapPlaces(category, center, signal);
}

async function fetchPartnerPlaces(category, center, signal) {
  const params = new URLSearchParams({
    category,
    lat: String(center.lat),
    lng: String(center.lng),
  });
  const response = await fetch(`/api/places?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`Partner places request failed with ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload.places) ? payload.places : [];
}

async function fetchOpenStreetMapPlaces(category, center, signal) {
  const query = buildOverpassQuery(category, center);
  const body = new URLSearchParams({ data: query });
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    body,
    signal: requestSignal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  });

  if (!response.ok) throw new Error(`Places request failed with ${response.status}`);
  const data = await response.json();

  return data.elements
    .map((element) => normalizeElement(element, category, center))
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function searchLocations(query, signal) {
  const params = new URLSearchParams({
    q: query.trim(),
    format: 'jsonv2',
    limit: '5',
    addressdetails: '1',
  });
  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`Location request failed with ${response.status}`);
  const results = await response.json();

  return results.map((result) => ({
    id: `${result.osm_type}-${result.osm_id}`,
    label: result.display_name,
    lat: Number(result.lat),
    lng: Number(result.lon),
  }));
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
    id: `${element.type}-${element.id}`,
    name: tags.name,
    category,
    kind: formatKind(tags.tourism || tags.amenity || category),
    lat,
    lng,
    address: address || 'Address not listed',
    description: tags.description || tags['description:en'] || '',
    cuisine: tags.cuisine
      ? tags.cuisine.split(';').map(formatKind).slice(0, 3)
      : [],
    openingHours: tags.opening_hours || '',
    phone: (tags.phone || tags['contact:phone'] || '').split(';')[0],
    website: safeUrl(tags.website || tags['contact:website']),
    distanceKm: distanceBetween(center, { lat, lng }),
    source: 'openstreetmap',
  };
}

export function formatKind(value) {
  return String(value)
    .replaceAll('_', ' ')
    .replaceAll(';', ' / ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function distanceBetween(origin, destination) {
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

function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}
