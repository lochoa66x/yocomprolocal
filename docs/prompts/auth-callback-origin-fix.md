# Auth Callback Origin Fix Prompt

Fix the seller magic link flow so Supabase does not send sellers to localhost.

The issue:

- A magic link can land on `http://localhost:3000/?code=...`.
- The homepage then renders instead of exchanging the auth code.
- The seller does not reach `/panel`.

Implement:

- Prefer `NEXT_PUBLIC_SITE_URL` when generating Supabase magic-link callback
  URLs.
- Fall back to the request origin only when it is not localhost.
- Use `https://yocomprolocal.com.mx` as the final safe default.
- Add a homepage fallback that detects `?code=...` and redirects to
  `/auth/callback?next=/panel`.
- Document the required Vercel and Supabase Auth URL settings.

Acceptance test:

1. Request a magic link from `/entrar`.
2. Confirm the generated callback uses `/auth/callback`.
3. Confirm localhost is not used unless `NEXT_PUBLIC_SITE_URL` is explicitly set
   to localhost for local testing.
4. Open `/?code=test-code` and confirm it redirects to
   `/auth/callback?code=test-code&next=/panel`.
5. Confirm TypeScript passes.
