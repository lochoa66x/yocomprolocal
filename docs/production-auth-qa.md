# Production Auth QA

Use this runbook before inviting real sellers into YoComproLocal.

## Goal

Confirm that seller login works on production from end to end:

1. A seller opens the panel.
2. The site asks for their email.
3. Supabase sends a magic link.
4. The magic link returns to YoComproLocal.
5. The seller lands in their own panel.
6. The seller can add, edit, publish, and share products.

## Before Deploy

Confirm these files have been deployed to Vercel:

- `app/entrar/page.tsx`
- `app/auth/callback/route.ts`
- `app/panel/page.tsx`
- `app/panel/vendedor/[slug]/page.tsx`
- `lib/supabase-server.ts`
- `supabase/migrations/20260621_seller_auth_foundation.sql`

## Vercel Environment Variables

Set these in the Vercel project before testing production auth:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://yocomprolocal.com.mx
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe for
  browser use because Supabase expects them.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- Never commit `.env.local`.
- Use `.env.example` only as a template.

## Supabase SQL

Run this migration in the Supabase SQL editor:

```text
supabase/migrations/20260621_seller_auth_foundation.sql
```

Then confirm the seller auth columns exist:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sellers'
  and column_name in ('id', 'slug', 'user_id', 'created_at', 'updated_at')
order by column_name;
```

Confirm the product ownership column exists:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
  and column_name = 'seller_id';
```

Confirm sellers have email and slug values:

```sql
select name, email, slug, user_id
from public.sellers
order by created_at desc
limit 10;
```

For existing sellers, `user_id` can be empty before first login. The app finds
the seller by email first, then routes the logged-in account to the seller
panel.

## Supabase Auth Settings

In Supabase, open **Authentication > URL Configuration**.

Set the site URL:

```text
https://yocomprolocal.com.mx
```

Add these redirect URLs:

```text
https://yocomprolocal.com.mx/auth/callback
https://www.yocomprolocal.com.mx/auth/callback
http://localhost:3000/auth/callback
```

Optional preview redirect for Vercel branches:

```text
https://*.vercel.app/auth/callback
```

## Production Smoke Test

Use an email that exists in `public.sellers`.

1. Open `https://yocomprolocal.com.mx/panel` while logged out.
2. Confirm the site redirects to `/entrar?next=/panel`.
3. Enter the seller email and request the magic link.
4. Open the email in the same browser.
5. Confirm the link returns to `/auth/callback?next=/panel`.
6. Confirm the site redirects to `/panel/vendedor/[seller-slug]`.
7. Add a product with title, price, category, description, and image if
   available.
8. Confirm the product appears on `/vendedor/[seller-slug]`.
9. Edit the product and save.
10. Use the share kit to copy a product message.
11. Sign out with `/auth/salir`.
12. Confirm `/panel` asks for login again.

## Common Failures

### Magic Link Email Does Not Arrive

Check spam first. If it still does not arrive, confirm Supabase Auth email is
enabled and watch for provider rate limits.

### Callback Shows Login Error

The callback URL is probably missing from Supabase Auth redirect URLs, or the
magic link expired. Add the redirect URL and request a new link.

### Magic Link Opens Localhost

Set `NEXT_PUBLIC_SITE_URL` in Vercel to:

```text
https://yocomprolocal.com.mx
```

Then redeploy. In Supabase Auth URL Configuration, confirm the site URL is also:

```text
https://yocomprolocal.com.mx
```

If a Supabase email still lands on `/?code=...`, the homepage forwards that code
to `/auth/callback?next=/panel` as a safety net.

### Panel Says Seller Profile Was Not Found

The logged-in email must match the seller email in `public.sellers`. Confirm:

```sql
select name, email, slug, user_id
from public.sellers
where lower(email) = lower('seller@example.com');
```

### Product Save Fails

Confirm the seller auth migration ran and `products.seller_id` exists. Also
confirm the Vercel deployment has `SUPABASE_SERVICE_ROLE_KEY`.

### Product Images Do Not Upload

Run the product image bucket migration:

```text
supabase/migrations/20260620_create_product_images_bucket.sql
```

Then confirm the `product-images` bucket exists in Supabase Storage.

### Login Keeps Looping

Confirm `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists in Vercel, then redeploy. Also
test again in a fresh browser window to rule out an old cookie.

## Ready Criteria

Production auth is ready when:

- `/panel` protects the seller dashboard.
- Magic links arrive reliably.
- The callback returns to the requested page.
- Sellers only land on their own dashboard.
- Product create, edit, publish, image upload, and share flows work.
- No service role key is exposed in client-side code or committed files.
