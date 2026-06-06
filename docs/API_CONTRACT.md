# IdentityGuard SaaS API Contract

This contract defines the commercial backend shape for IdentityGuard. It is defensive-only and designed to keep raw identity data out of the server.

## Authentication

### `POST /v1/auth/signup`

Request:

```json
{
  "email": "customer@example.com",
  "password": "user-managed-password",
  "displayName": "Customer Name"
}
```

Response:

```json
{
  "userId": "usr_123",
  "emailVerificationRequired": true
}
```

### `POST /v1/auth/login`

Request:

```json
{
  "email": "customer@example.com",
  "password": "user-managed-password"
}
```

Response:

```json
{
  "userId": "usr_123",
  "sessionExpiresAt": "2026-06-07T18:00:00.000Z"
}
```

## Vault Sync

### `PUT /v1/vaults/{vaultId}`

Store an encrypted vault blob. The backend must not receive raw identity records.

Request:

```json
{
  "version": 1,
  "ciphertext": "encrypted-client-payload",
  "nonce": "base64-iv",
  "deviceId": "dev_123",
  "updatedAt": "2026-06-06T18:00:00.000Z"
}
```

Response:

```json
{
  "saved": true,
  "serverVersion": 12
}
```

### `GET /v1/vaults/{vaultId}`

Response:

```json
{
  "version": 12,
  "ciphertext": "encrypted-client-payload",
  "nonce": "base64-iv",
  "updatedAt": "2026-06-06T18:00:00.000Z"
}
```

## Billing

### `POST /v1/billing/checkout`

Request:

```json
{
  "plan": "Pro",
  "successUrl": "https://example.com/account",
  "cancelUrl": "https://example.com/billing"
}
```

Response:

```json
{
  "checkoutUrl": "https://payment-provider.example/checkout/session"
}
```

## Risk Analysis

### `POST /v1/risk/analyze`

Request:

```json
{
  "context": "Business banking",
  "aliasAgeDays": 0,
  "reuseCount": 0
}
```

Response:

```json
{
  "summary": "Medium caution recommended.",
  "score": 54,
  "findings": [],
  "recommendations": []
}
```

## Security Controls

- reject payloads above configured size limits
- rate-limit signup, login, reset, and risk endpoints
- store only encrypted vault blobs
- never log raw passwords, tokens, identity fields, or vault ciphertext in plain operational logs
- verify payment webhooks server-side
- return generic auth errors to reduce account enumeration
