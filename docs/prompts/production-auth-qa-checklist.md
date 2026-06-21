# Production Auth QA Checklist Prompt

Create a production-ready authentication setup and QA checklist for YoComproLocal.

The goal is to make sure real sellers can log in with magic links on the live
domain, reach their seller panel, and manage products without needing technical
support.

Implement:

- A human-friendly production auth runbook.
- A clear Vercel environment variable checklist.
- A clear Supabase Auth redirect URL checklist.
- SQL verification queries for seller ownership and product ownership.
- A production smoke test for the complete seller login flow.
- Troubleshooting notes for common Supabase, Vercel, and email-link failures.
- An example environment file that documents required keys without exposing
  real secrets.
- Links from existing project docs to the new runbook.

Keep the MVP boundaries tight:

- No password login.
- No buyer accounts.
- No admin approval work.
- No new database tables.
- No payment, shipping, or inventory workflows.

Acceptance test:

1. Confirm `/panel` sends logged-out sellers to `/entrar?next=/panel`.
2. Request a magic link using a seller email that exists in `public.sellers`.
3. Confirm the email link returns to `/auth/callback?next=/panel`.
4. Confirm `/panel` redirects to `/panel/vendedor/[slug]`.
5. Confirm the seller can add, edit, publish, and share products.
6. Confirm sign-out returns the seller to the logged-out state.
