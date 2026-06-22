# Public Seller Directory Prompt

## Goal

Create a public seller directory for YoComproLocal so buyers can discover local businesses even when they do not have a direct product link.

## Prompt

Create `/vendedores` as a public directory page that shows local sellers from Supabase.

Each seller card should include:

- Business name
- Zone
- Short description
- Published product count
- Link to the public seller page
- WhatsApp contact button when available

Add simple search with query params:

`/vendedores?q=postres`

Search should match seller name, zone, and description. Include a clear empty state when no sellers match.

Add a clear homepage path to `/vendedores` so buyers can reach the directory from the main page.

Keep the experience Spanish-first, warm, local, mobile-first, and simple for non-technical buyers.

Do not add payments, checkout, shipping, inventory, authentication, admin approval, or database schema changes.

## Acceptance Criteria

- `/vendedores` renders sellers from Supabase.
- `/vendedores?q=...` filters sellers by name, zone, or description.
- Seller cards link to public seller pages.
- Seller cards show WhatsApp contact when a phone number exists.
- Seller cards show published product counts.
- The homepage links clearly to `/vendedores`.
- No Supabase schema changes are required.
