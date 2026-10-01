# Travel Advisor

A map-first travel discovery app by [Alok Jha](https://github.com/alokj0409). Search a city, explore nearby restaurants, stays, and attractions, then save interesting places for later.

This version is a substantial modernization of the original open-source tutorial project. It replaces the legacy Create React App stack, keeps OpenStreetMap for the map and location search, protects optional provider keys behind a small Node server, and adds a responsive interface, accessibility states, test coverage, and repository documentation.

## Highlights

- Search cities and landmarks with OpenStreetMap Nominatim
- Explore richer restaurant and attraction data from Travel Advisor when configured
- See provider-backed photos, ratings, review counts, pricing, hours, and contact details
- Check current conditions from OpenWeather
- Fall back to OpenStreetMap place data and a labeled local set when providers are unavailable
- Switch between food, stays, and attractions
- Keep the list and map selection in sync
- Save favorites locally in the browser
- Use current location with a clear permission flow
- Continue with a labeled demo set when live place data is unavailable
- Use the full interface on desktop, tablet, and mobile
- Follow the operating-system light or dark preference

No Google Maps key is required. The app remains usable without provider keys; Travel Advisor and OpenWeather enhance the experience when configured.

## Tech stack

- React 19
- Vite 8
- React Leaflet and Leaflet
- OpenStreetMap tiles, Nominatim search, and Overpass fallback data
- Travel Advisor API through RapidAPI
- OpenWeather current conditions
- A dependency-free Node HTTP layer for secret-backed requests
- Phosphor Icons
- Vitest and ESLint

## Getting started

Requirements:

- Node.js 22.12 or newer
- npm 11 or newer

```bash
git clone https://github.com/alokj0409/travel-advisor.git
cd travel-advisor
npm install
```

For the enhanced provider data, copy `.env.example` to `.env.local` and add your own credentials:

```env
RAPIDAPI_TRAVEL_KEY=your_rapidapi_key
OPENWEATHER_API_KEY=your_openweather_key
```

Then run:

```bash
npm run dev
```

Open the local URL printed by Vite.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the React app and protected local API server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build with `.env.local` |
| `npm start` | Serve `dist/` using deployment environment variables |
| `npm run lint` | Run the code-quality checks |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Configuration

The app works with its keyless OpenStreetMap path. Optional provider credentials add richer content and current weather:

```env
RAPIDAPI_TRAVEL_KEY=
OPENWEATHER_API_KEY=
VITE_OVERPASS_API_URL=https://overpass-api.de/api/interpreter
VITE_NOMINATIM_URL=https://nominatim.openstreetmap.org/search
```

`RAPIDAPI_TRAVEL_KEY` and `OPENWEATHER_API_KEY` are read only by the Node server. Never add a `VITE_` prefix to a secret because Vite exposes those values to browser code. `.env.local` is ignored by Git.

## Data behavior

The app requests place data after a location search, a category change, or an explicit **Search this area** action. It does not request data continuously while the map moves. Provider responses are normalized, cached in memory for ten minutes, and limited to 30 results.

Restaurants and attractions prefer Travel Advisor data. Hotels and unavailable provider responses fall back to OpenStreetMap. If live place services are unavailable, the interface clearly labels a small New Delhi demo set. Weather is optional and disappears cleanly when unavailable.

Nominatim and Overpass are public services with usage policies and availability limits. For high-traffic production use, configure managed or self-hosted endpoints.

Production deployments that use secret-backed providers must run `npm start` on a Node-capable host and set the server environment variables there. A static-only deployment still works through the keyless OpenStreetMap path, but cannot safely use RapidAPI or OpenWeather secrets.

## Project structure

```text
src/
  components/       Interface components
  data/             Labeled offline demo data
  hooks/            Place-loading state
  services/         Nominatim, Overpass, weather, and API adapters
  App.jsx           Application orchestration
  styles.css        Design tokens and responsive styles
server/
  providers/        Travel Advisor and OpenWeather clients/normalizers
  router.js         Validated, cached same-origin API routes
  index.js          Development middleware and production server
docs/
  ARCHITECTURE.md   Data flow and technical decisions
  DESIGN.md         Visual and interaction specification
```

## Quality and accessibility

The interface includes keyboard focus states, semantic labels, reduced-motion support, responsive layouts, high-contrast light and dark themes, loading skeletons, empty states, and contextual errors. CI runs linting, tests, and a production build on every pull request.

## Attribution and license

This repository is a derivative of Adrian Hajdin's MIT-licensed [project_travel_advisor](https://github.com/adrianhajdin/project_travel_advisor). The original copyright notice is preserved as required by the license. See [ATTRIBUTION.md](ATTRIBUTION.md) for the detailed change summary.

Licensed under the [MIT License](LICENSE).
