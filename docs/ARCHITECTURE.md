# Architecture

## Overview

Travel Advisor is a client-rendered React application with a small same-origin Node server. The browser talks directly to public OpenStreetMap services for tiles and location search. Secret-backed Travel Advisor and OpenWeather requests pass through the server so credentials never enter the browser bundle.

```text
User action
  -> App state
  -> browser service adapter
  -> same-origin API or keyless OpenStreetMap fallback
  -> provider normalizer
  -> normalized place model
  -> list and Leaflet map
```

## Main responsibilities

### `App.jsx`

Owns the selected area, category, result filter, selected place, location-search state, and favorite identifiers. It coordinates the list and map without introducing global state.

### `services/places.js`

Contains all third-party data concerns:

- builds bounded Overpass QL queries
- searches Nominatim only after an explicit form submission
- prefers the same-origin Travel Advisor route for restaurants and attractions
- requests same-origin OpenWeather data for the selected area
- normalizes OpenStreetMap nodes, ways, and relations into one place shape
- validates external website protocols
- calculates distance from the current search center

Keeping this work outside components makes the data contract testable and replaceable.

### `server/`

Owns secrets and upstream provider traffic:

- validates categories and coordinates before making upstream requests
- applies a 12-second timeout and ten-minute in-memory cache
- normalizes Travel Advisor and OpenWeather responses
- limits Travel Advisor place responses to 30 records
- serves Vite middleware during development and `dist/` in production

The server never returns API credentials or raw provider errors.

### `hooks/usePlaces.js`

Owns request lifecycle state. It aborts superseded fetches, distinguishes loading, success, empty, and fallback states, and exposes an explicit retry action.

### Interface components

- `Header`: location search, geolocation, and repository identity
- `List`: category navigation, local filtering, and result states
- `PlaceDetails`: one normalized place and its actions
- `Map`: Leaflet lifecycle, markers, popups, and manual area search

## Place model

Every source is normalized to:

```js
{
  id,
  name,
  category,
  kind,
  lat,
  lng,
  address,
  description,
  cuisine,
  openingHours,
  phone,
  website,
  providerUrl,
  photo,
  rating,
  reviewCount,
  priceLevel,
  ranking,
  distanceKm,
  source,
}
```

The UI does not read raw OpenStreetMap tags.

## Reliability decisions

- Fetches are abortable to prevent stale results from replacing newer searches.
- Moving the map never triggers a background request. The user confirms with **Search this area**.
- A small labeled New Delhi demo dataset keeps the initial project reviewable if Overpass is unavailable.
- Favorites use `localStorage`; they are device-local and require no account.
- Secrets stay in `.env.local` or deployment environment variables and are never prefixed with `VITE_`.
- The keyless OpenStreetMap path remains available when provider credentials are absent.

## Deployment boundary

Secret-backed providers require the included Node server. A static deployment can still render the map, search locations, and use the OpenStreetMap fallback, but it cannot safely access RapidAPI or OpenWeather credentials. High-traffic deployments should replace the in-memory cache with a shared store and add host-level rate limiting and observability.
