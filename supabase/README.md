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

For real product image uploads, run:

`supabase/migrations/20260620_create_product_images_bucket.sql`

This creates a public Supabase Storage bucket named `product-images`.

For seller login and protected product management, run:

`supabase/migrations/20260621_seller_auth_foundation.sql`

This adds seller slugs, Supabase Auth ownership, `seller_id` on products, and
RLS policies so sellers can manage their own profiles and products.

Vercel also needs these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

In Supabase Auth settings, add these redirect URLs:

- `https://yocomprolocal.com.mx/auth/callback`
- `https://www.yocomprolocal.com.mx/auth/callback`
- `http://localhost:3000/auth/callback`

Set the Magic Link email button to:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/panel">
  Abrir mi panel
</a>
```

If the email template Source panel is grayed out, leave the default Supabase
magic-link template in place for now. The app also supports the default link
format and will complete the login through `/auth/session`.

For the full production login checklist and smoke test, see:

`docs/production-auth-qa.md`

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
