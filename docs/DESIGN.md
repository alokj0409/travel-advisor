# Design specification

## Design read

A map-first travel product for everyday travelers and portfolio reviewers. The visual language is calm, editorial, and practical. The map and place content remain primary.

Design dials:

- Design variance: 6/10
- Motion intensity: 3/10
- Visual density: 6/10

## Visual system

The interface uses cool mineral neutrals, a forest map-marker color, and one burnt-orange accent. The accent consistently identifies primary actions, active states, saved places, and focus affordances.

Semantic CSS variables define surfaces, ink, muted text, borders, accent, danger, and shadows. A single media query swaps the palette for dark mode.

Shape rules:

- cards and panels use 16px corners
- compact interface controls use 10-14px corners
- buttons and search fields use pill corners

## Typography

The stack prefers Aptos and Segoe UI, then falls back to the operating-system sans serif. Headings use tighter letter spacing and moderate scale so the interface stays compact around the map.

## Layout

Desktop uses a fixed-width result panel beside a fluid map. Mobile places the map first and lets the results continue in the document flow. The header search moves to its own row below 860px.

## Interaction

- Searching is submit-based instead of request-per-keystroke.
- Map movement reveals one explicit **Search this area** action.
- Selecting a list result moves the map; selecting a marker updates the list state.
- Favorites provide immediate local feedback and survive reloads.
- Motion is limited to state feedback and Leaflet navigation.

## Accessibility

- all icon-only controls have accessible names
- keyboard focus uses a visible accent outline
- category tabs expose pressed state
- loading regions expose busy state
- errors and fallbacks are contextual, not transient toasts
- reduced-motion preference disables non-essential animation
- text and control colors target WCAG AA contrast

## Content principles

Labels describe real actions. Demo content is explicitly identified. Ratings, review counts, prices, rankings, and photos appear only when returned by the configured Travel Advisor provider; the OpenStreetMap and demo paths never invent them.
