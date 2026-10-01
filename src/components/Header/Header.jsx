import { useId, useState } from 'react';
import {
  CloudSun,
  Crosshair,
  GithubLogo,
  MagnifyingGlass,
  MapPin,
  X,
} from '@phosphor-icons/react';

export default function Header({
  areaLabel,
  locationError,
  locationResults,
  locationStatus,
  onChooseLocation,
  onLocationSearch,
  onUseCurrentLocation,
  weather,
  weatherStatus,
}) {
  const [query, setQuery] = useState('');
  const resultsId = useId();

  const submitSearch = (event) => {
    event.preventDefault();
    onLocationSearch(query);
  };

  const chooseLocation = (location) => {
    setQuery(location.label.split(',').slice(0, 2).join(','));
    onChooseLocation(location);
  };

  return (
    <header className="topbar">
      <a className="brand" href="./" aria-label="Travel Advisor home">
        <span className="brand-mark" aria-hidden="true"><MapPin weight="fill" /></span>
        <span>
          <strong>Travel Advisor</strong>
          <small>by alokj0409</small>
        </span>
      </a>

      <div className="location-search-wrap">
        <form className="location-search" onSubmit={submitSearch} role="search">
          <MagnifyingGlass aria-hidden="true" />
          <label className="sr-only" htmlFor="location-query">Search for a city or landmark</label>
          <input
            aria-controls={resultsId}
            aria-expanded={locationResults.length > 0}
            autoComplete="off"
            id="location-query"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a city or landmark"
            type="search"
            value={query}
          />
          {query && (
            <button
              aria-label="Clear location search"
              className="icon-button compact"
              onClick={() => setQuery('')}
              type="button"
            >
              <X />
            </button>
          )}
          <button className="search-submit" disabled={locationStatus === 'loading'} type="submit">
            {locationStatus === 'loading' ? 'Searching' : 'Search'}
          </button>
        </form>

        {locationResults.length > 0 && (
          <ul className="location-results" id={resultsId}>
            {locationResults.map((location) => (
              <li key={location.id}>
                <button onClick={() => chooseLocation(location)} type="button">
                  <MapPin aria-hidden="true" />
                  <span>{location.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {locationError && <p className="location-error" role="alert">{locationError}</p>}
      </div>

      <div className="topbar-actions">
        {weatherStatus === 'success' && weather && (
          <div
            aria-label={`${weather.temperatureC} degrees Celsius, ${weather.condition}`}
            className="weather-summary"
            title={`Feels like ${weather.feelsLikeC ?? weather.temperatureC}°C · Wind ${weather.windKph ?? 0} km/h · OpenWeather`}
          >
            <CloudSun aria-hidden="true" />
            <span>
              <strong>{weather.temperatureC}°</strong>
              <small>{weather.condition}</small>
            </span>
          </div>
        )}
        <div className="current-area" title={areaLabel}>
          <span>Exploring</span>
          <strong>{areaLabel}</strong>
        </div>
        <button className="location-button" onClick={onUseCurrentLocation} type="button">
          <Crosshair aria-hidden="true" />
          <span>{locationStatus === 'locating' ? 'Locating' : 'Near me'}</span>
        </button>
        <a
          aria-label="View alokj0409 on GitHub"
          className="icon-button github-link"
          href="https://github.com/alokj0409"
          rel="noreferrer"
          target="_blank"
        >
          <GithubLogo weight="fill" />
        </a>
      </div>
    </header>
  );
}
