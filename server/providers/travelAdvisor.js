const TRAVEL_ADVISOR_HOST = 'travel-advisor.p.rapidapi.com';
const TRAVEL_ADVISOR_URL = `https://${TRAVEL_ADVISOR_HOST}`;
const SUPPORTED_CATEGORIES = new Set(['restaurants', 'hotels', 'attractions']);

export function buildBoundary(center, radiusKm = 5) {
  const latitudeDelta = radiusKm / 111;
  const longitudeScale = Math.max(Math.cos(center.lat * (Math.PI / 180)), 0.2);
  const longitudeDelta = radiusKm / (111 * longitudeScale);

  return {
    bottomLeft: {
      lat: center.lat - latitudeDelta,
      lng: center.lng - longitudeDelta,
    },
    topRight: {
      lat: center.lat + latitudeDelta,
      lng: center.lng + longitudeDelta,
    },
  };
}

export async function fetchTravelAdvisorPlaces({ category, center, signal }) {
  const apiKey = process.env.RAPIDAPI_TRAVEL_KEY;
  if (!apiKey) throw new ProviderConfigurationError('Travel Advisor is not configured.');
  if (!SUPPORTED_CATEGORIES.has(category)) throw new TypeError('Unsupported place category.');

  const boundary = buildBoundary(center);
  const params = new URLSearchParams({
    bl_latitude: boundary.bottomLeft.lat.toFixed(5),
    bl_longitude: boundary.bottomLeft.lng.toFixed(5),
    tr_latitude: boundary.topRight.lat.toFixed(5),
    tr_longitude: boundary.topRight.lng.toFixed(5),
    currency: 'USD',
    lunit: 'km',
    lang: 'en_US',
  });
  const response = await fetch(`${TRAVEL_ADVISOR_URL}/${category}/list-in-boundary?${params}`, {
    signal,
    headers: {
      Accept: 'application/json',
      'x-rapidapi-host': TRAVEL_ADVISOR_HOST,
      'x-rapidapi-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new ProviderResponseError('Travel Advisor request failed.', response.status);
  }

  const payload = await response.json();
  return (Array.isArray(payload.data) ? payload.data : [])
    .map((place) => normalizeTravelPlace(place, category, center))
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 30);
}

export function normalizeTravelPlace(place, category, center) {
  const lat = Number(place.latitude);
  const lng = Number(place.longitude);
  if (!place.location_id || !place.name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const cuisine = Array.isArray(place.cuisine)
    ? place.cuisine.map((item) => item?.name).filter(Boolean).slice(0, 3)
    : [];
  const kind = place.subcategory?.[0]?.name
    || place.category?.name
    || category.slice(0, -1);
  const photo = place.photo?.images?.medium?.url
    || place.photo?.images?.large?.url
    || '';

  return {
    id: `travel-${place.location_id}`,
    name: String(place.name),
    category,
    kind: formatLabel(kind),
    lat,
    lng,
    address: place.address || formatAddress(place.address_obj) || 'Address not listed',
    description: String(place.description || ''),
    cuisine,
    openingHours: String(place.open_now_text || ''),
    phone: String(place.phone || '').split(';')[0],
    website: safeUrl(place.website),
    providerUrl: safeUrl(place.web_url),
    photo: safeUrl(photo),
    rating: finiteNumber(place.rating),
    reviewCount: finiteNumber(place.num_reviews),
    priceLevel: String(place.price_level || place.price || ''),
    ranking: String(place.ranking || ''),
    distanceKm: distanceBetween(center, { lat, lng }),
    source: 'travel-advisor',
  };
}

export class ProviderConfigurationError extends Error {}

export class ProviderResponseError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function formatAddress(address = {}) {
  return [address.street1, address.street2, address.city, address.country]
    .filter(Boolean)
    .join(', ');
}

function formatLabel(value) {
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
