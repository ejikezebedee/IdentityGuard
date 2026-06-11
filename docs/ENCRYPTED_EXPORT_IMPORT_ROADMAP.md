# Encrypted Export and Import Roadmap

IdentityGuard MVP exports plaintext JSON only after a user-facing warning. This is useful for inspection and manual portability, but it is not safe storage by itself.

## MVP Guardrail

- Warn before every plaintext export: "Exported vault files are plaintext. Store them securely."
- Keep default vault storage encrypted in browser local storage.
- Keep exported files out of source control and runtime folders.

## Planned Encrypted Export

1. Add an "Export encrypted vault" action that reuses the current vault key or derives a separate export key from a fresh export passphrase.
2. Save a versioned envelope containing `version`, `kdf`, `salt`, `iterations`, `iv`, and `ciphertext`.
3. Add an import validator that rejects unknown versions, malformed JSON, missing fields, and failed AES-GCM authentication.
4. Show a clear overwrite/merge choice before importing aliases.
5. Record audit events for encrypted export, failed import, successful import, and merge conflicts.

## Security Notes

- Never send plaintext exports to a backend.
- Never log passphrases, vault plaintext, or ciphertext payloads.
- Treat imported files as untrusted until schema validation and decryption succeed.
