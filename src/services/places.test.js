import { describe, expect, it } from 'vitest';
import {
  buildOverpassQuery,
  distanceBetween,
  formatKind,
  normalizeElement,
} from './places.js';

const center = { lat: 28.6139, lng: 77.209 };

describe('buildOverpassQuery', () => {
  it('uses a bounded restaurant query around the selected center', () => {
    const query = buildOverpassQuery('restaurants', center);

    expect(query).toContain('around:5000,28.61390,77.20900');
    expect(query).toContain('restaurant|cafe|fast_food');
    expect(query).toContain('["name"]');
  });

  it('uses the attraction filter when requested', () => {
    expect(buildOverpassQuery('attractions', center)).toContain('attraction|museum|viewpoint');
  });
});

describe('normalizeElement', () => {
  it('normalizes a node into the application place model', () => {
    const place = normalizeElement({
      type: 'node',
      id: 42,
      lat: 28.614,
      lon: 77.21,
      tags: {
        name: 'Test Kitchen',
        amenity: 'restaurant',
        cuisine: 'north_indian;vegetarian',
        'addr:street': 'Sample Road',
        website: 'example.com',
      },
    }, 'restaurants', center);

    expect(place).toMatchObject({
      id: 'node-42',
      name: 'Test Kitchen',
      category: 'restaurants',
      kind: 'Restaurant',
      address: 'Sample Road',
      cuisine: ['North Indian', 'Vegetarian'],
      website: 'https://example.com/',
      source: 'openstreetmap',
    });
    expect(place.distanceKm).toBeGreaterThan(0);
  });

  it('uses center coordinates for ways and rejects unnamed elements', () => {
    const place = normalizeElement({
      type: 'way',
      id: 7,
      center: { lat: 28.62, lon: 77.22 },
      tags: { name: 'City Museum', tourism: 'museum' },
    }, 'attractions', center);

    expect(place.lat).toBe(28.62);
    expect(place.kind).toBe('Museum');
    expect(normalizeElement({ type: 'node', id: 8, lat: 1, lon: 2 }, 'hotels', center)).toBeNull();
  });

  it('drops unsafe website protocols', () => {
    const place = normalizeElement({
      type: 'node',
      id: 12,
      lat: 28.61,
      lon: 77.2,
      tags: { name: 'Unsafe Link', tourism: 'hotel', website: 'javascript:alert(1)' },
    }, 'hotels', center);

    expect(place.website).toBe('');
  });
});

describe('utility helpers', () => {
  it('formats OpenStreetMap tag values for people', () => {
    expect(formatKind('guest_house')).toBe('Guest House');
    expect(formatKind('fast_food;restaurant')).toBe('Fast Food / Restaurant');
  });

  it('returns zero distance for the same point', () => {
    expect(distanceBetween(center, center)).toBe(0);
  });
});
