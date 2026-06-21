# Public Product Discovery Prompt

## Goal

Create the buyer-facing discovery page for YoComproLocal so people can browse products without needing a direct seller link.

## Prompt

Create `/productos` as a public catalog page that shows published products from Supabase.

Each product card should include:

- Product image
- Category
- Product title
- Price
- Short description
- Seller name
- Seller zone
- Link to the product detail page
- Link to the seller page
- WhatsApp contact button

Add simple category filtering with query params:

`/productos?categoria=Comida`

Include a `Todos` option and category links based on the existing `PRODUCT_CATEGORIES` list.

Use the current YoComproLocal warm local visual style. Keep it mobile-first, Spanish-first, and simple.

Also add a clear link to `/productos` from the homepage navigation.

Do not add payments, cart, checkout, shipping, inventory, authentication, dashboards, or admin approval.

## Acceptance Criteria

- `/productos` renders published products.
- `/productos?categoria=Comida` filters to one category.
- Cards link to product detail pages and seller pages.
- Cards include a WhatsApp CTA when the seller has WhatsApp.
- The homepage navigation links to `/productos`.
- No Supabase schema changes are required.
