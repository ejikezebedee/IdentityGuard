# Security Policy

IdentityGuard is defensive, local-first privacy software. It is designed to reduce identity reuse by generating service-specific aliases and storing them in an encrypted browser vault.

## Supported Security Model

- Identity input is processed in the browser.
- Vault records are encrypted with AES-GCM using a key derived locally with PBKDF2.
- The default risk model runs locally and does not require a cloud API key.
- Vault passphrases must be at least 12 characters.
- Weak passphrases reduce vault safety because the encrypted vault is protected by a passphrase-derived key.
- Plaintext vault exports are portable but sensitive. Exported vault files are plaintext. Store them securely.
- Optional AI analysis should be routed through a private backend endpoint, not through browser-exposed secrets.

## Important Limitations

- Browser local storage can still be affected by malware, compromised browsers, malicious extensions, and device theft.
- IdentityGuard does not replace official identity documents, password managers, legal identity checks, or regulated KYC systems.
- Generated aliases are privacy workflow identifiers, not government IDs or cryptographic credentials.

## Reporting Issues

Please open a GitHub issue for defensive security bugs, documentation mistakes, or privacy model concerns. Do not submit exploit instructions, credential data, or real identity records in issues.
