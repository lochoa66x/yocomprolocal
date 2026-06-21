# Homepage Featured Products Prompt

## Goal

Make the homepage feel alive by showing real products from local sellers.

## Prompt

Add homepage featured products to YoComproLocal.

On the homepage, add a Spanish-first section that pulls the latest 3 published products from Supabase and displays them as featured local products.

Each featured product card should show:

- Product image or current gradient fallback
- Category
- Product title
- Price
- Short description
- Seller name
- Seller zone
- Link to the product detail page
- WhatsApp contact button when available

Place the section after the buyer/value section and before the `Cómo funciona` section, so the homepage starts feeling alive with real local products.

Add a clear CTA to `/productos` labeled `Ver todos los productos`.

Because the homepage uses a client component for language switching, split the homepage into a server wrapper that fetches featured products and a client component that handles the language toggle.

Use existing helpers for formatting price, product slugs, short descriptions, seller lookup, and WhatsApp links. Keep the design warm, local, mobile-first, and consistent with the existing YoComproLocal UI.

Do not add payments, cart, checkout, authentication, admin workflows, or database schema changes.

## Acceptance Criteria

- The homepage fetches latest published products from Supabase on the server.
- The homepage keeps the Spanish/English toggle.
- The featured section shows up to 3 published products.
- Product cards link to product detail pages and seller pages.
- WhatsApp buttons appear when seller WhatsApp exists.
- If no products exist, the section shows a warm empty state.
