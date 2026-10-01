import {
  Binoculars,
  Buildings,
  ForkKnife,
  MagnifyingGlass,
  WarningCircle,
} from '@phosphor-icons/react';
import PlaceDetails from '../PlaceDetails/PlaceDetails.jsx';
import { CATEGORIES } from '../../services/places.js';

const CATEGORY_ICONS = {
  restaurants: ForkKnife,
  hotels: Buildings,
  attractions: Binoculars,
};

function LoadingList() {
  return (
    <div className="skeleton-list" aria-label="Loading places" role="status">
      {[0, 1, 2].map((item) => (
        <div className="place-skeleton" key={item}>
          <span />
          <strong />
          <p />
          <p />
        </div>
      ))}
    </div>
  );
}

export default function List({
  category,
  dataSource,
  error,
  favorites,
  filter,
  onCategoryChange,
  onFilterChange,
  onRefresh,
  onSelectPlace,
  onToggleFavorite,
  places,
  selectedId,
  status,
  totalPlaces,
}) {
  return (
    <aside className="places-panel" aria-label="Place results">
      <div className="places-panel-header">
        <div>
          <span className="section-label">Curated by the map</span>
          <h1>{CATEGORIES[category].heading}</h1>
          <p>{totalPlaces} {totalPlaces === 1 ? 'place' : 'places'} in this area</p>
        </div>

        <div className="category-tabs" aria-label="Place category">
          {Object.entries(CATEGORIES).map(([key, definition]) => {
            const Icon = CATEGORY_ICONS[key];
            return (
              <button
                aria-pressed={category === key}
                className={category === key ? 'is-active' : ''}
                key={key}
                onClick={() => onCategoryChange(key)}
                type="button"
              >
                <Icon aria-hidden="true" />
                {definition.label}
              </button>
            );
          })}
        </div>

        <label className="result-filter">
          <span className="sr-only">Filter the current results</span>
          <MagnifyingGlass aria-hidden="true" />
          <input
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Filter these results"
            type="search"
            value={filter}
          />
        </label>
      </div>

      {error && (
        <div className="data-notice" role="status">
          <WarningCircle aria-hidden="true" />
          <span>{error}</span>
          <button onClick={onRefresh} type="button">Retry live data</button>
        </div>
      )}

      <div className="places-list" aria-busy={status === 'loading'}>
        {status === 'loading' && <LoadingList />}

        {status === 'empty' && (
          <div className="empty-state">
            <Binoculars aria-hidden="true" />
            <h2>No mapped places here yet</h2>
            <p>Move the map to a nearby center or try another category.</p>
          </div>
        )}

        {status !== 'loading' && places.length === 0 && status !== 'empty' && (
          <div className="empty-state">
            <MagnifyingGlass aria-hidden="true" />
            <h2>No matching results</h2>
            <p>Clear the filter to see all available places.</p>
          </div>
        )}

        {status !== 'loading' && places.map((place) => (
          <PlaceDetails
            isFavorite={favorites.includes(place.id)}
            key={place.id}
            onSelect={() => onSelectPlace(place)}
            onToggleFavorite={() => onToggleFavorite(place.id)}
            place={place}
            selected={selectedId === place.id}
          />
        ))}
      </div>

      <footer className="panel-footer">
        <span>
          {dataSource === 'travel-advisor' && 'Place data via Travel Advisor API'}
          {dataSource === 'openstreetmap' && 'Place data © OpenStreetMap contributors'}
          {dataSource === 'demo' && 'Labeled demo data'}
        </span>
        {dataSource === 'travel-advisor' ? (
          <a href="https://rapidapi.com/apidojo/api/travel-advisor" rel="noreferrer" target="_blank">Provider</a>
        ) : (
          <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">Data terms</a>
        )}
      </footer>
    </aside>
  );
}
