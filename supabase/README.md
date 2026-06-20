# Supabase Setup

Run SQL files from `supabase/migrations` in the Supabase SQL editor.

For the product foundation, run:

`supabase/migrations/20260620_create_products.sql`

If Supabase says `column "seller_slug" does not exist`, it means a previous
`products` table already existed. Because we do not have real product data yet,
run:

`supabase/migrations/20260620_reset_products_foundation.sql`

For this MVP, products use `seller_slug` to connect to public seller pages like `/vendedor/la-cocina-de-maria`.

If Vercel logs show `Supabase products error` with code `42501`, run:

`supabase/migrations/20260620_grant_products_access.sql`

Later, when the seller dashboard and authentication are ready, we can add a permanent `seller_id` relationship.

Demo seller seed:

`supabase/seeds/20260620_la_cocina_de_maria_seller.sql`

Example test product:

```sql
insert into public.products (
  seller_slug,
  title,
  slug,
  price,
  category,
  description,
  image_url,
  status
) values (
  'la-cocina-de-maria',
  'Tamales caseros',
  'tamales-caseros',
  25,
  'Comida',
  'Tamales hechos en casa, listos para pedido por WhatsApp.',
  null,
  'published'
);
```
