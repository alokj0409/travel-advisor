import { describe, expect, it } from 'vitest';
import { normalizeWeather } from './openWeather.js';

describe('OpenWeather provider', () => {
  it('normalizes current weather into a compact UI model', () => {
    expect(normalizeWeather({
      main: { temp: 27.6, feels_like: 29.2, humidity: 64 },
      weather: [{ description: 'scattered clouds', icon: '03d' }],
      wind: { speed: 3.5 },
      name: 'New Delhi',
    })).toEqual({
      temperatureC: 28,
      feelsLikeC: 29,
      condition: 'scattered clouds',
      icon: '03d',
      humidity: 64,
      windKph: 13,
      locationName: 'New Delhi',
      source: 'openweather',
    });
  });

  it('rejects payloads without a temperature', () => {
    expect(normalizeWeather({ weather: [] })).toBeNull();
  });
});
