# Security policy

## Supported version

Security fixes are made on the latest `main` branch.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Contact the repository owner through the private contact options on the [alokj0409 GitHub profile](https://github.com/alokj0409).

Include:

- the affected file or feature
- steps to reproduce the problem
- the likely impact
- any suggested mitigation

Please avoid accessing data that does not belong to you while validating a report.

## Secrets

This project does not require secrets for its keyless fallback. Optional `RAPIDAPI_TRAVEL_KEY` and `OPENWEATHER_API_KEY` values belong in `.env.local` during development or in server-side deployment environment variables.

Values prefixed with `VITE_` are bundled into browser code and must never contain private credentials. `.env.local` is ignored by Git. If a key is ever committed, rotate it with the provider before removing it from repository history.

The included Node server validates coordinates and categories, limits response size, times out upstream requests, caches successful responses, and returns generic provider errors without exposing credentials.
