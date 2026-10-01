# Contributing

Thanks for helping improve Travel Advisor.

## Development workflow

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm install`.
3. Make the smallest coherent change that solves the problem.
4. Run `npm run lint`, `npm test`, and `npm run build`.
5. Open a pull request that explains the user-facing behavior and verification.

## Code guidelines

- Keep browser API handling inside `src/services` and secret-backed providers inside `server/providers`.
- Normalize provider data before it reaches UI components.
- Preserve loading, empty, error, and offline behavior.
- Use semantic HTML and visible keyboard focus states.
- Do not add secrets or API keys to the repository.
- Add tests for parsing, query-building, or other data behavior.

## Commit messages

Use a short imperative subject, for example:

```text
Add keyboard navigation to location results
```

## Pull requests

Keep pull requests reviewable. Include screenshots for visual changes and list the commands used to verify the work.
