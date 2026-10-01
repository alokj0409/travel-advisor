const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

export async function fetchCurrentWeather({ center, signal }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new WeatherConfigurationError('OpenWeather is not configured.');

  const params = new URLSearchParams({
    lat: center.lat.toFixed(5),
    lon: center.lng.toFixed(5),
    appid: apiKey,
    units: 'metric',
  });
  const response = await fetch(`${OPENWEATHER_URL}?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new WeatherResponseError('OpenWeather request failed.', response.status);
  return normalizeWeather(await response.json());
}

export function normalizeWeather(payload) {
  const temperatureC = Number(payload.main?.temp);
  const feelsLikeC = Number(payload.main?.feels_like);
  const windKph = Number(payload.wind?.speed) * 3.6;
  if (!Number.isFinite(temperatureC)) return null;

  return {
    temperatureC: Math.round(temperatureC),
    feelsLikeC: Number.isFinite(feelsLikeC) ? Math.round(feelsLikeC) : null,
    condition: String(payload.weather?.[0]?.description || 'Current weather'),
    icon: String(payload.weather?.[0]?.icon || ''),
    humidity: finiteNumber(payload.main?.humidity),
    windKph: Number.isFinite(windKph) ? Math.round(windKph) : null,
    locationName: String(payload.name || ''),
    source: 'openweather',
  };
}

export class WeatherConfigurationError extends Error {}

export class WeatherResponseError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
