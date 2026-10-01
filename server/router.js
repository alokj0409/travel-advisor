import {
  fetchTravelAdvisorPlaces,
  ProviderConfigurationError,
  ProviderResponseError,
} from './providers/travelAdvisor.js';
import {
  fetchCurrentWeather,
  WeatherConfigurationError,
  WeatherResponseError,
} from './providers/openWeather.js';

const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12000;
const cache = new Map();

export async function handleApiRequest(request, response, url) {
  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return true;
  }

  if (url.pathname === '/api/places') {
    const category = url.searchParams.get('category') || '';
    const center = readCenter(url);
    if (!center || !['restaurants', 'hotels', 'attractions'].includes(category)) {
      sendJson(response, 400, { error: 'A valid category, latitude, and longitude are required.' });
      return true;
    }

    await respondWithProvider(
      response,
      `places:${category}:${cacheCenter(center)}`,
      (signal) => loadPlaces(category, center, signal),
    );
    return true;
  }

  if (url.pathname === '/api/weather') {
    const center = readCenter(url);
    if (!center) {
      sendJson(response, 400, { error: 'A valid latitude and longitude are required.' });
      return true;
    }

    await respondWithProvider(response, `weather:${cacheCenter(center)}`, async (signal) => ({
      weather: await fetchCurrentWeather({ center, signal }),
      source: 'openweather',
    }));
    return true;
  }

  return false;
}

async function loadPlaces(category, center, signal) {
  if (category === 'hotels') return { places: [], source: 'openstreetmap-fallback' };

  try {
    const places = await fetchTravelAdvisorPlaces({ category, center, signal });
    if (places.length) return { places, source: 'travel-advisor' };
  } catch (error) {
    if (error.name === 'AbortError') throw error;
  }

  return { places: [], source: 'openstreetmap-fallback' };
}

async function respondWithProvider(response, cacheKey, loader) {
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    sendJson(response, 200, cached.value, { 'X-Cache': 'HIT' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const value = await loader(controller.signal);
    cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    sendJson(response, 200, value, { 'X-Cache': 'MISS' });
  } catch (error) {
    if (error instanceof ProviderConfigurationError || error instanceof WeatherConfigurationError) {
      sendJson(response, 503, { error: 'This data provider is not configured.' });
    } else if (error instanceof ProviderResponseError || error instanceof WeatherResponseError) {
      sendJson(response, 502, { error: 'The upstream data provider returned an error.' });
    } else if (error.name === 'AbortError') {
      sendJson(response, 504, { error: 'The upstream data provider timed out.' });
    } else {
      sendJson(response, 502, { error: 'Live provider data is temporarily unavailable.' });
    }
  } finally {
    clearTimeout(timeout);
  }
}

function readCenter(url) {
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function cacheCenter(center) {
  return `${center.lat.toFixed(3)}:${center.lng.toFixed(3)}`;
}

function sendJson(response, status, value, extraHeaders = {}) {
  response.writeHead(status, {
    'Cache-Control': status === 200 ? 'private, max-age=300' : 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  response.end(JSON.stringify(value));
}
