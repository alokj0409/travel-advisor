import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header/Header.jsx';
import List from './components/List/List.jsx';
import Map from './components/Map/Map.jsx';
import { usePlaces } from './hooks/usePlaces.js';
import { useWeather } from './hooks/useWeather.js';
import { searchLocations } from './services/places.js';

const DEFAULT_AREA = {
  lat: 28.6139,
  lng: 77.209,
  label: 'New Delhi, India',
};

const readFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem('travel-advisor:favorites')) ?? [];
  } catch {
    return [];
  }
};

export default function App() {
  const [category, setCategory] = useState('restaurants');
  const [queryArea, setQueryArea] = useState(DEFAULT_AREA);
  const [mapCenter, setMapCenter] = useState(DEFAULT_AREA);
  const [pendingCenter, setPendingCenter] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('');
  const [favorites, setFavorites] = useState(readFavorites);
  const [locationResults, setLocationResults] = useState([]);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const { places, status, error, isDemo, refresh } = usePlaces(queryArea, category);
  const { weather, status: weatherStatus } = useWeather(queryArea);

  useEffect(() => {
    localStorage.setItem('travel-advisor:favorites', JSON.stringify(favorites));
  }, [favorites]);

  const visiblePlaces = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return places;

    return places.filter((place) => (
      `${place.name} ${place.kind} ${place.address} ${place.cuisine.join(' ')}`
        .toLowerCase()
        .includes(term)
    ));
  }, [filter, places]);

  const handleLocationSearch = async (query) => {
    if (!query.trim()) return;

    setLocationStatus('loading');
    setLocationError('');
    try {
      const results = await searchLocations(query);
      setLocationResults(results);
      setLocationStatus('success');
      if (!results.length) setLocationError('No matching locations found. Try a city or landmark.');
    } catch {
      setLocationResults([]);
      setLocationStatus('error');
      setLocationError('Location search is unavailable right now. Please try again.');
    }
  };

  const chooseLocation = (location) => {
    const nextArea = { lat: location.lat, lng: location.lng, label: location.label };
    setQueryArea(nextArea);
    setMapCenter(nextArea);
    setPendingCenter(null);
    setSelectedId(null);
    setFilter('');
    setLocationResults([]);
    setLocationStatus('idle');
  };

  const useCurrentLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Location access is not supported by this browser.');
      return;
    }

    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => chooseLocation({
        lat: coords.latitude,
        lng: coords.longitude,
        label: 'Near your current location',
      }),
      () => {
        setLocationStatus('error');
        setLocationError('Location permission was not granted. Search for a city instead.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const toggleFavorite = (placeId) => {
    setFavorites((current) => (
      current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : [...current, placeId]
    ));
  };

  const changeCategory = (nextCategory) => {
    setCategory(nextCategory);
    setSelectedId(null);
    setFilter('');
  };

  const selectPlace = (place) => {
    setSelectedId(place.id);
  };

  const searchMovedArea = () => {
    if (!pendingCenter) return;
    const nextArea = {
      ...pendingCenter,
      label: 'Selected map area',
    };
    setQueryArea(nextArea);
    setMapCenter(nextArea);
    setPendingCenter(null);
    setSelectedId(null);
    setFilter('');
  };

  return (
    <div className="app-shell">
      <Header
        areaLabel={queryArea.label}
        locationError={locationError}
        locationResults={locationResults}
        locationStatus={locationStatus}
        onChooseLocation={chooseLocation}
        onLocationSearch={handleLocationSearch}
        onUseCurrentLocation={useCurrentLocation}
        weather={weather}
        weatherStatus={weatherStatus}
      />

      <main className="workspace">
        <List
          category={category}
          dataSource={places[0]?.source ?? (isDemo ? 'demo' : 'openstreetmap')}
          error={error}
          favorites={favorites}
          filter={filter}
          onCategoryChange={changeCategory}
          onFilterChange={setFilter}
          onRefresh={refresh}
          onSelectPlace={selectPlace}
          onToggleFavorite={toggleFavorite}
          places={visiblePlaces}
          selectedId={selectedId}
          status={status}
          totalPlaces={places.length}
        />

        <Map
          center={mapCenter}
          onMapMoved={setPendingCenter}
          onSearchMovedArea={searchMovedArea}
          onSelectPlace={selectPlace}
          pendingCenter={pendingCenter}
          places={visiblePlaces}
          selectedId={selectedId}
        />
      </main>
    </div>
  );
}
