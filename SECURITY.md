# Security policy

Do not report vulnerabilities in public issues. Send a minimal reproduction to `security@meminios.com` and avoid including real customer content.

## Local security model

- `.env` files, OAuth credentials, model keys, KMS grants, and Stripe secrets are ignored.
- Local development authentication is explicit and must be disabled outside `local`.
- The database runtime role is non-superuser and subject to forced RLS.
- Test fixtures contain synthetic names and content only.

## Review gates

Changes to a read path must add or update tenant/ACL tests. Changes to prompts must pass the injection corpus. Changes to governed skills must preserve approval and trust invariants. Changes to data-plane wiring must keep endpoints configuration-driven.
