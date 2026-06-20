# Product Foundation Prompt

Create the YoComproLocal product foundation for the MVP.

Add a Supabase `products` table with:

- product title
- price
- category
- description
- image URL
- seller link
- product slug

Add app-level helpers and types for product records, product slugs, product categories, and price formatting.

Connect the public seller profile page so it can display published products when the table exists, while still showing a clean empty state before products are uploaded.

Keep the scope disciplined: no payments, no shipping, no inventory system, and no AI generation yet.
