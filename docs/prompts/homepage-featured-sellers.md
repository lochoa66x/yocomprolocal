# Homepage Featured Sellers Prompt

## Goal

Make the YoComproLocal homepage feel more alive by showing real local sellers with published products.

## Prompt

Add featured sellers to the YoComproLocal homepage.

Scope:

- Fetch sellers from Supabase that have at least one published product.
- Show up to 3 featured seller cards on the homepage.
- Each card should include:
  - Business name
  - Zone
  - Short description
  - Published product count
  - Link to public seller page
  - WhatsApp contact button when available
- Keep the `/vendedores` CTA visible.
- If there are no sellers with published products, keep a helpful fallback state.
- Keep the experience Spanish-first, mobile-first, warm, and local.
- Do not change the database schema.

## Acceptance Criteria

- Homepage renders up to 3 sellers with published products.
- Featured seller cards link to `/vendedor/[slug]`.
- Featured seller cards show product counts.
- WhatsApp CTAs appear when sellers have phone numbers.
- Homepage still links clearly to `/vendedores`.
- TypeScript and production build pass.
