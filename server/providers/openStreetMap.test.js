import { describe, expect, it } from 'vitest';
import {
  buildNominatimHotelUrl,
  buildOverpassQuery,
  normalizeElement,
  normalizeNominatimHotel,
} from './openStreetMap.js';

const center = { lat: 28.6139, lng: 77.209 };

describe('OpenStreetMap provider', () => {
  it('builds a bounded hotel query with common accommodation types', () => {
    const query = buildOverpassQuery('hotels', center);

    expect(query).toContain('around:6000,28.61390,77.20900');
    expect(query).toContain('hotel|hostel|guest_house|motel|apartment');
    expect(query).toContain('["name"]');
  });

  it('normalizes mapped accommodation into the shared place model', () => {
    const place = normalizeElement({
      type: 'way',
      id: 77,
      center: { lat: 28.62, lon: 77.21 },
      tags: {
        name: 'Mapped Hotel',
        tourism: 'guest_house',
        'addr:street': 'Sample Road',
        website: 'mapped.example',
      },
    }, 'hotels', center);

    expect(place).toMatchObject({
      id: 'osm-way-77',
      name: 'Mapped Hotel',
      category: 'hotels',
      kind: 'Guest House',
      address: 'Sample Road',
      website: 'https://mapped.example/',
      source: 'openstreetmap',
    });
  });

  it('builds a bounded Nominatim hotel search URL', () => {
    const url = new URL(buildNominatimHotelUrl(center));

    expect(url.searchParams.get('q')).toBe('hotel');
    expect(url.searchParams.get('bounded')).toBe('1');
    expect(url.searchParams.get('viewbox')).toBe('77.14743,28.66795,77.27057,28.55985');
  });

  it('normalizes a Nominatim hotel result', () => {
    const place = normalizeNominatimHotel({
      osm_type: 'way',
      osm_id: 101,
      lat: '28.62',
      lon: '77.21',
      name: 'City Lodge',
      category: 'tourism',
      type: 'hotel',
      display_name: 'City Lodge, Central Delhi, India',
      extratags: { website: 'city-lodge.example', phone: '+91 12345' },
    }, center);

    expect(place).toMatchObject({
      id: 'osm-way-101',
      name: 'City Lodge',
      category: 'hotels',
      kind: 'Hotel',
      address: 'City Lodge, Central Delhi, India',
      website: 'https://city-lodge.example/',
      phone: '+91 12345',
      source: 'openstreetmap',
    });
  });

  it('rejects unnamed elements', () => {
    expect(normalizeElement({
      type: 'node',
      id: 9,
      lat: 28.61,
      lon: 77.2,
    }, 'hotels', center)).toBeNull();

    expect(normalizeNominatimHotel({
      osm_type: 'node',
      osm_id: 10,
      lat: '28.61',
      lon: '77.2',
      category: 'tourism',
      type: 'hotel',
    }, center)).toBeNull();
  });
});
