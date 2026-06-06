# IdentityGuard

![IdentityGuard product cover](./docs/product-images/identityguard-open-source-cover.png)

IdentityGuard is a local-first digital alias vault for privacy-preserving identity workflows. It helps users create one-use aliases for banks, exchanges, vendors, marketplaces, onboarding forms, and other contexts where reusing the same identity reference increases exposure.

The default open-source build runs in the browser, encrypts the vault locally, and does not require a cloud API key.

## Why It Exists

People reuse the same identity details across too many services. When one service leaks, it becomes easier to link the same person across other platforms. IdentityGuard gives users a practical workflow:

- create a unique alias per service context
- keep alias history in an encrypted local vault
- copy, revoke, and export aliases
- review local risk notes before using an alias
- avoid exposing AI/API secrets in browser code

## Features

- Local-first React/Vite app
- Encrypted browser vault using AES-GCM
- PBKDF2-derived vault key from the user's passphrase
- Strong browser crypto through Web Crypto APIs
- Base58-encoded digital aliases
- Local deterministic risk analysis
- Optional private AI endpoint support through `VITE_IDENTITYGUARD_AI_ENDPOINT`
- Copy, revoke, export, and clear vault controls
- Defensive-only open-source security posture

## Security Model

IdentityGuard default mode keeps identity processing in the browser. It does not send name, date of birth, address, or context to a server.

The vault is encrypted before being stored in browser local storage. This improves privacy but does not make a compromised device safe. Malware, malicious browser extensions, device theft, and weak passphrases can still put data at risk.

Generated aliases are privacy workflow identifiers. They are not official IDs, legal credentials, or authentication tokens.

## Quick Start

Requirements:

- Node.js 20 or newer
- npm

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in your terminal.

## Production Build

```bash
npm run typecheck
npm run build
npm run preview
```

## Optional AI Endpoint

The open-source app does not expose Gemini, OpenAI, or other model-provider keys in the browser.

If you want AI-assisted risk analysis, create your own private backend endpoint and set:

```bash
VITE_IDENTITYGUARD_AI_ENDPOINT=https://your-private-endpoint.example.com/analyze
```

The endpoint should accept:

```json
{
  "context": "Business banking"
}
```

And return:

```json
{
  "summary": "High caution recommended for this identity workflow.",
  "score": 72,
  "findings": [],
  "recommendations": []
}
```

If no endpoint is configured, IdentityGuard uses local deterministic analysis.

## Project Structure

```text
.
├── App.tsx
├── constants.tsx
├── index.html
├── index.tsx
├── services
│   ├── cryptoService.ts
│   ├── geminiService.ts
│   ├── riskService.ts
│   └── vaultService.ts
├── styles.css
├── types.ts
└── vite.config.ts
```

## Roadmap

- Add automated browser smoke tests
- Add import flow for exported vault files
- Add passphrase strength meter
- Add optional WebAuthn unlock support
- Add signed release artifacts
- Add private backend example for AI risk analysis

## Defensive Use Only

IdentityGuard is intended for privacy hygiene, identity compartmentalization, and defensive security education. Do not use it for fraud, impersonation, unauthorized access, credential theft, evasion, or deception.

## License

MIT
