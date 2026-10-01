const DEMO_PLACES = [
  {
    id: 'demo-india-gate',
    name: 'India Gate',
    category: 'attractions',
    kind: 'Memorial',
    lat: 28.6129,
    lng: 77.2295,
    address: 'Kartavya Path, New Delhi',
    description: 'A landmark war memorial at the heart of New Delhi.',
  },
  {
    id: 'demo-lodhi-garden',
    name: 'Lodhi Garden',
    category: 'attractions',
    kind: 'Garden',
    lat: 28.5931,
    lng: 77.2197,
    address: 'Lodhi Road, New Delhi',
    description: 'Historic tombs, shaded paths, and generous lawns.',
  },
  {
    id: 'demo-national-museum',
    name: 'National Museum',
    category: 'attractions',
    kind: 'Museum',
    lat: 28.6118,
    lng: 77.2195,
    address: 'Janpath, New Delhi',
    description: 'A broad collection spanning Indian art and history.',
  },
  {
    id: 'demo-cafe-lota',
    name: 'Cafe Lota',
    category: 'restaurants',
    kind: 'Restaurant',
    lat: 28.6133,
    lng: 77.2422,
    address: 'Pragati Maidan, New Delhi',
    description: 'Regional Indian cooking in a relaxed courtyard setting.',
    cuisine: ['Indian'],
  },
  {
    id: 'demo-indian-accent',
    name: 'Indian Accent',
    category: 'restaurants',
    kind: 'Restaurant',
    lat: 28.5928,
    lng: 77.2381,
    address: 'Lodhi Road, New Delhi',
    description: 'Inventive dishes rooted in Indian flavors.',
    cuisine: ['Indian', 'Contemporary'],
  },
  {
    id: 'demo-saravana-bhavan',
    name: 'Saravana Bhavan',
    category: 'restaurants',
    kind: 'Restaurant',
    lat: 28.6273,
    lng: 77.2191,
    address: 'Janpath, Connaught Place',
    description: 'A reliable stop for South Indian vegetarian dishes.',
    cuisine: ['South Indian', 'Vegetarian'],
  },
  {
    id: 'demo-imperial',
    name: 'The Imperial',
    category: 'hotels',
    kind: 'Hotel',
    lat: 28.6254,
    lng: 77.2185,
    address: 'Janpath Lane, New Delhi',
    description: 'A landmark heritage hotel close to Connaught Place.',
  },
  {
    id: 'demo-claridges',
    name: 'The Claridges',
    category: 'hotels',
    kind: 'Hotel',
    lat: 28.6008,
    lng: 77.2164,
    address: 'Aurangzeb Road, New Delhi',
    description: 'A central stay with a long-standing Delhi presence.',
  },
  {
    id: 'demo-la-suite',
    name: 'Bloomrooms @ Janpath',
    category: 'hotels',
    kind: 'Hotel',
    lat: 28.6241,
    lng: 77.218,
    address: 'Janpath, New Delhi',
    description: 'A compact modern stay near the city center.',
  },
];

export const getDemoPlaces = (category, center) => DEMO_PLACES
  .filter((place) => place.category === category)
  .map((place) => ({
    ...place,
    cuisine: place.cuisine ?? [],
    distanceKm: distanceBetween(center, place),
    openingHours: '',
    phone: '',
    website: '',
    providerUrl: '',
    photo: '',
    rating: null,
    reviewCount: null,
    priceLevel: '',
    ranking: '',
    source: 'demo',
  }))
  .sort((a, b) => a.distanceKm - b.distanceKm);

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
