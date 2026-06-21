# Seller Dashboard Lite Prompt

## Goal

Give each seller a simple place to manage their YoComproLocal presence without
adding authentication, payments, shipping, or admin workflow yet.

## Prompt

Create a lightweight seller dashboard for YoComproLocal.

Build route:

`/panel/vendedor/[slug]`

The dashboard should fetch seller data and the seller's products from Supabase.
It should show a practical seller work surface with:

- Seller name
- Zone
- Description
- WhatsApp status
- Product count
- Public seller page link
- Copy/share area for the public seller page
- Clear CTA to add another product
- Clear CTA to view the public page

Each product card should show:

- Product image or the current gradient fallback
- Title
- Price
- Category
- Status
- Public product page link when published
- WhatsApp message link when the seller has WhatsApp
- CTA to add another product

Use existing helpers for seller lookup, initials, image fallback, price
formatting, product slugs, short descriptions, and WhatsApp links.

Keep the interface Spanish-first, mobile-friendly, warm, and easy for a
non-technical seller to understand.

Do not add:

- Authentication
- Payments
- Shipping
- Inventory management
- Admin approval
- Database schema changes

## Acceptance Criteria

- `/panel/vendedor/la-cocina-de-maria` loads seller info and products.
- Product cards link to public product pages when the product is published.
- Dashboard links back to `/vendedor/la-cocina-de-maria`.
- Seller page share/copy area exists.
- Empty state encourages adding the first product.
- TypeScript passes.
