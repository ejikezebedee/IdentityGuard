# IdentityGuard SaaS Implementation Plan

IdentityGuard can be operated in two modes:

- `Local-first`: the current open-source browser app. Vault records stay encrypted in the browser.
- `Hosted SaaS`: a commercial service with accounts, billing, encrypted cloud sync, audit history, and optional private AI analysis.

## Commercial SaaS Scope

The SaaS version should add:

- customer accounts with email verification, password reset, sessions, and account deletion
- zero-knowledge encrypted vault sync, where the server stores encrypted blobs only
- payment subscriptions for Free, Pro, and Team plans
- audit logs for account and vault workflow events
- private AI/risk endpoint that never exposes provider keys in browser code
- production support processes, monitoring, backups, and abuse prevention

## Privacy Requirements

The backend must not require raw name, date of birth, address, or identity context for vault storage.

Recommended sync payload shape:

```json
{
  "vaultId": "client-generated-id",
  "version": 3,
  "ciphertext": "base64-or-url-safe-encrypted-payload",
  "nonce": "base64-iv",
  "updatedAt": "2026-06-06T18:00:00.000Z"
}
```

The server should validate ownership and size limits, then store the encrypted payload. Decryption must happen on the client.

## Suggested Backend Modules

- `auth`: signup, login, email verification, password reset, session refresh, account deletion
- `billing`: checkout, subscription status, webhook handling, invoice links, cancellation
- `vault-sync`: encrypted blob upload, download, conflict resolution, device list
- `risk`: optional private AI analysis endpoint
- `audit`: user-visible account events and defensive security logs
- `admin`: abuse review, support tooling, read-only customer status views

## Production Checklist

- HTTPS-only deployment
- secure cookies for sessions
- CSRF protection where cookie auth is used
- strict CORS allowlist
- rate limits on auth and risk endpoints
- encrypted database backups
- no browser-exposed AI or payment secret keys
- privacy policy and terms of service published
- vulnerability reporting process published
- export and account deletion flow available to users

## Payment Positioning

Suggested pricing:

- Free: local vault, manual export, local risk checks
- Pro: encrypted sync, multiple devices, priority risk workflows
- Team: shared policy controls, audit review, admin seat management

Do not charge customers until production billing, legal pages, support, and security review are complete.
