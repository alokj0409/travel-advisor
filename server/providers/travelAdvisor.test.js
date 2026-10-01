import { describe, expect, it } from 'vitest';
import { buildBoundary, normalizeTravelPlace } from './travelAdvisor.js';

const center = { lat: 28.6139, lng: 77.209 };

describe('Travel Advisor provider', () => {
  it('builds a compact map boundary around the selected center', () => {
    const boundary = buildBoundary(center);

    expect(boundary.bottomLeft.lat).toBeLessThan(center.lat);
    expect(boundary.bottomLeft.lng).toBeLessThan(center.lng);
    expect(boundary.topRight.lat).toBeGreaterThan(center.lat);
    expect(boundary.topRight.lng).toBeGreaterThan(center.lng);
  });

  it('normalizes provider records into the application place model', () => {
    const place = normalizeTravelPlace({
      location_id: '1234',
      name: 'Sample Table',
      latitude: '28.6145',
      longitude: '77.2100',
      category: { name: 'restaurant' },
      cuisine: [{ name: 'Indian' }, { name: 'Vegetarian Friendly' }],
      address: '1 Sample Road, New Delhi',
      description: 'A short provider description.',
      open_now_text: 'Open now',
      rating: '4.5',
      num_reviews: '210',
      price_level: '$$',
      website: 'sample.example',
      web_url: 'https://www.tripadvisor.example/sample',
      photo: { images: { medium: { url: 'https://images.example/sample.jpg' } } },
    }, 'restaurants', center);

    expect(place).toMatchObject({
      id: 'travel-1234',
      name: 'Sample Table',
      category: 'restaurants',
      kind: 'Restaurant',
      cuisine: ['Indian', 'Vegetarian Friendly'],
      rating: 4.5,
      reviewCount: 210,
      priceLevel: '$$',
      source: 'travel-advisor',
      website: 'https://sample.example/',
    });
    expect(place.distanceKm).toBeGreaterThan(0);
  });

  it('rejects incomplete records and unsafe links', () => {
    expect(normalizeTravelPlace({ name: 'No ID' }, 'hotels', center)).toBeNull();

    const place = normalizeTravelPlace({
      location_id: '9',
      name: 'Safe Hotel',
      latitude: 28.61,
      longitude: 77.2,
      category: { name: 'hotel' },
      website: 'javascript:alert(1)',
    }, 'hotels', center);

    expect(place.website).toBe('');
  });
});
