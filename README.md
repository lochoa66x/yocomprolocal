# YoComproLocal

**Compra local. Vende mejor.**

YoComproLocal.com.mx is a local commerce platform concept for small businesses,
independent sellers, artisans, home-based entrepreneurs, and local service
providers in **Cuautitlán Izcalli, México**.

The first version is a local discovery platform and AI-powered storefront
assistant. Sellers publish simple product pages and buyers contact them directly
through WhatsApp or another seller-provided channel.

## MVP Direction

The MVP should include:

- Public landing page
- Seller registration
- Seller dashboard
- Business profile creation
- Product upload form
- Product image upload
- Public product pages
- Public seller pages
- WhatsApp contact button
- Basic categories
- Admin approval and moderation
- AI-generated product title, description, tags, and sales copy

The MVP should avoid:

- Payments
- Shipping
- Refunds
- Marketplace commissions
- Complex logistics
- Split payments
- Full ecommerce inventory management

## Tech Stack

- Next.js
- Vercel
- Supabase
- OpenAI API
- GitHub
- WhatsApp links

## Brand Direction

YoComproLocal should feel local, warm, human, trustworthy, simple,
mobile-first, Spanish-first, and friendly to non-technical sellers.

## Development

Environment variables used by the MVP:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://yocomprolocal.com.mx
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
```

Use `.env.example` as the local setup template. Keep `.env.local` private.

For production seller login setup, follow:

`docs/production-auth-qa.md`

Start the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```
