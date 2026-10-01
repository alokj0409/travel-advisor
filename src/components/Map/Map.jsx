import { useEffect, useMemo, useRef } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet';
import { ArrowRight, MapPin } from '@phosphor-icons/react';

function MapViewport({ center, onMapMoved, selectedPlace }) {
  const map = useMap();
  const programmaticMove = useRef(false);
  const destination = selectedPlace ?? center;

  useEffect(() => {
    const current = map.getCenter();
    const hasMoved = (
      Math.abs(current.lat - destination.lat) > 0.0005
      || Math.abs(current.lng - destination.lng) > 0.0005
    );

    if (hasMoved) {
      programmaticMove.current = true;
      map.flyTo([destination.lat, destination.lng], selectedPlace ? 16 : 14, { duration: 0.8 });
    }
  }, [destination.lat, destination.lng, map, selectedPlace]);

  useMapEvents({
    moveend() {
      if (programmaticMove.current) {
        programmaticMove.current = false;
        return;
      }
      const nextCenter = map.getCenter();
      onMapMoved({ lat: nextCenter.lat, lng: nextCenter.lng });
    },
  });

  return null;
}

export default function Map({
  center,
  onMapMoved,
  onSearchMovedArea,
  onSelectPlace,
  pendingCenter,
  places,
  selectedId,
}) {
  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedId) ?? null,
    [places, selectedId],
  );

  return (
    <section className="map-panel" aria-label="Interactive place map">
      <MapContainer
        center={[center.lat, center.lng]}
        className="travel-map"
        scrollWheelZoom
        zoom={14}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <MapViewport center={center} onMapMoved={onMapMoved} selectedPlace={selectedPlace} />

        {places.map((place) => {
          const selected = place.id === selectedId;
          return (
            <CircleMarker
              center={[place.lat, place.lng]}
              eventHandlers={{ click: () => onSelectPlace(place) }}
              key={place.id}
              pathOptions={{
                color: selected ? '#812f17' : '#f9f8f3',
                fillColor: selected ? '#c4512e' : '#27362f',
                fillOpacity: 1,
                weight: selected ? 4 : 2,
              }}
              radius={selected ? 12 : 8}
            >
              <Popup>
                <div className="map-popup">
                  <span>{place.kind}</span>
                  <strong>{place.name}</strong>
                  <p>{place.address}</p>
                  <button onClick={() => onSelectPlace(place)} type="button">
                    View details <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="map-caption">
        <MapPin aria-hidden="true" weight="fill" />
        <span>{places.length} mapped {places.length === 1 ? 'place' : 'places'}</span>
      </div>

      {pendingCenter && (
        <button className="search-area-button" onClick={onSearchMovedArea} type="button">
          Search this area
        </button>
      )}
    </section>
  );
}
