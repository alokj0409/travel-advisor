import {
  ArrowSquareOut,
  Clock,
  Heart,
  MapPin,
  Phone,
  Star,
} from '@phosphor-icons/react';

function formatDistance(distanceKm) {
  if (distanceKm < 1) return `${Math.max(50, Math.round(distanceKm * 1000 / 50) * 50)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

export default function PlaceDetails({
  isFavorite,
  onSelect,
  onToggleFavorite,
  place,
  selected,
}) {
  return (
    <article className={`place-card${selected ? ' is-selected' : ''}`} id={`place-${place.id}`}>
      {place.photo && (
        <img
          alt=""
          className="place-photo"
          loading="lazy"
          onError={(event) => { event.currentTarget.hidden = true; }}
          referrerPolicy="no-referrer"
          src={place.photo}
        />
      )}
      <div className="place-card-heading">
        <button className="place-title-button" onClick={onSelect} type="button">
          <span className="place-kind">{place.kind}</span>
          <strong>{place.name}</strong>
        </button>
        <button
          aria-label={`${isFavorite ? 'Remove' : 'Save'} ${place.name}`}
          aria-pressed={isFavorite}
          className={`favorite-button${isFavorite ? ' is-favorite' : ''}`}
          onClick={onToggleFavorite}
          type="button"
        >
          <Heart weight={isFavorite ? 'fill' : 'regular'} />
        </button>
      </div>

      {place.description && <p className="place-description">{place.description}</p>}

      {(place.rating || place.priceLevel || place.ranking) && (
        <div className="place-meta" aria-label="Place highlights">
          {place.rating && (
            <span>
              <Star aria-hidden="true" weight="fill" />
              {place.rating.toFixed(1)}
              {place.reviewCount ? ` (${place.reviewCount.toLocaleString()} reviews)` : ''}
            </span>
          )}
          {place.priceLevel && <span>{place.priceLevel}</span>}
          {place.ranking && <span>{place.ranking}</span>}
        </div>
      )}

      {place.cuisine.length > 0 && (
        <div className="tag-row" aria-label="Cuisine">
          {place.cuisine.map((item) => <span key={item}>{item}</span>)}
        </div>
      )}

      <dl className="place-facts">
        <div>
          <dt><MapPin aria-hidden="true" /> Address</dt>
          <dd>{place.address}</dd>
        </div>
        {place.openingHours && (
          <div>
            <dt><Clock aria-hidden="true" /> Hours</dt>
            <dd>{place.openingHours}</dd>
          </div>
        )}
        {place.phone && (
          <div>
            <dt><Phone aria-hidden="true" /> Phone</dt>
            <dd><a href={`tel:${place.phone}`}>{place.phone}</a></dd>
          </div>
        )}
      </dl>

      <div className="place-card-footer">
        <span>{formatDistance(place.distanceKm)} from map center</span>
        {place.website && (
          <a href={place.website} rel="noreferrer" target="_blank">
            Website <ArrowSquareOut aria-hidden="true" />
          </a>
        )}
        {!place.website && place.providerUrl && (
          <a href={place.providerUrl} rel="noreferrer" target="_blank">
            View listing <ArrowSquareOut aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}
