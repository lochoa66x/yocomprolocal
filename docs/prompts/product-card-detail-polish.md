# Product Card and Detail Polish Prompt

## Goal

Polish the public buyer experience now that product upload, photos, AI copy, and seller storefronts work.

## Prompt

Improve the YoComproLocal product browsing flow so seller pages stay clean and product pages feel ready to share with buyers.

On the seller profile page:

- Keep product cards easy to scan even when AI generates long descriptions.
- Show only a short preview of each product description.
- Add a clear `Ver producto` action on every card.
- Keep `Preguntar por WhatsApp` visible and easy to tap.
- Make sure the whole card still feels clickable without blocking the WhatsApp action.

On the product detail page:

- Make the product feel like a finished mini sales page.
- Keep the full AI description on the detail page.
- Highlight the product title, seller, zone, category, price, image, and WhatsApp contact.
- Include a clear path back to the seller storefront.
- Preserve the warm, local, mobile-first YoComproLocal brand tone.

Do not add payments, shipping, checkout, inventory management, or admin workflows in this step.

## Acceptance Criteria

- Seller product cards do not become too tall because of long AI descriptions.
- Buyers can open a product detail page from each product card.
- Product detail pages show the full description and a strong WhatsApp CTA.
- The UX works well on mobile and desktop.
- No Supabase schema changes are required.
