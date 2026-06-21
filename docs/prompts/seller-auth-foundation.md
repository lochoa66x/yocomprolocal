# Seller Auth Foundation Prompt

Build the first secure seller-login foundation for YoComproLocal.

The goal is to move the MVP from public slug-based seller tools to seller-owned
accounts, without adding password friction for non-technical local businesses.
Use Supabase Auth magic links so sellers can enter with the email attached to
their seller profile.

Implement:

- A `/entrar` page where sellers request a magic link by email.
- A Supabase Auth callback route at `/auth/callback`.
- A sign-out route at `/auth/salir`.
- A cookie-backed Supabase auth client for Server Components, Server Actions,
  and Route Handlers.
- A shared seller-access helper that:
  - redirects unauthenticated users to `/entrar`;
  - claims existing seller profiles when the logged-in email matches the seller
    email;
  - blocks access when the seller belongs to another user.
- Protection for:
  - `/panel/vendedor/[slug]`;
  - `/panel/vendedor/[slug]/perfil`;
  - `/producto/nuevo?seller=...`;
  - `/panel/vendedor/[slug]/producto/[productSlug]/editar`.
- A Supabase migration that adds:
  - `sellers.id`;
  - `sellers.slug`;
  - `sellers.user_id`;
  - `products.seller_id`;
  - indexes, relationships, grants, and RLS policies.
- Registration flow updates so new sellers go to login after registering.
- Dashboard UI that shows the active session email and offers sign out.

Keep the MVP boundaries tight:

- No passwords.
- No buyer accounts.
- No admin approval changes.
- No payments.
- No subscriptions.
- No role-management UI.

Acceptance test:

1. Run the Supabase migration.
2. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
3. Add `/auth/callback` URLs in Supabase Auth settings.
4. Visit `/panel/vendedor/la-cocina-de-maria` while logged out.
5. Confirm it redirects to `/entrar`.
6. Request a magic link with the seller email.
7. Open the email link.
8. Confirm the app lands in the seller dashboard.
9. Confirm product creation and product editing still work.
