# Contributing

Thank you for improving IdentityGuard.

## Development

1. Install Node.js 20 or newer.
2. Install dependencies with `npm install`.
3. Run `npm run dev`.
4. Verify changes with `npm run typecheck` and `npm run build`.

## Contribution Rules

- Keep the project defensive and privacy-preserving.
- Do not add credential harvesting, stealth, evasion, persistence, or unauthorized access workflows.
- Do not expose API keys in browser bundles.
- Document security limitations honestly.
- Prefer local-first behavior before optional cloud features.
