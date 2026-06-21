# Product Detail Page Prompt

Build the first public product sales page for YoComproLocal.

Create a route like:

`/vendedor/[sellerSlug]/producto/[productSlug]`

Example:

`/vendedor/la-cocina-de-maria/producto/cochinita`

The goal is to let every product have its own shareable page that sellers can send directly to customers through WhatsApp, Facebook, Instagram, or local groups.

## Requirements

- Fetch the seller from Supabase using the seller slug.
- Fetch one published product from Supabase using seller slug, product slug, and `status = published`.
- Show a polished mobile-first product page in Spanish.
- Include YoComproLocal header, link back to seller profile, large product photo, category, title, price, description, seller name, seller zone, and WhatsApp contact button.
- The WhatsApp button should generate a product-specific message.
- If the product has no image, show the existing warm YoComproLocal gradient placeholder.
- If seller or product does not exist, return `notFound()`.
- Keep the page simple, warm, local, trustworthy, and Spanish-first.

## Also Update

- On the seller profile page, make each product card clickable.
- Clicking a product opens `/vendedor/[sellerSlug]/producto/[productSlug]`.
- Keep the WhatsApp button on the card working.

## Avoid

- Payments.
- Shipping.
- Checkout.
- Inventory.
- Admin approval changes.
- AI generation in this step.

## Acceptance Test

1. Visit `/vendedor/la-cocina-de-maria`.
2. Click the cochinita product card.
3. Confirm it opens `/vendedor/la-cocina-de-maria/producto/cochinita`.
4. Confirm the page shows photo, title, price, description, seller, and WhatsApp button.
5. Click the WhatsApp button and confirm the message mentions the product.
