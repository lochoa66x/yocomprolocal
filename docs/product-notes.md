# YoComproLocal Product Notes

These notes capture product concerns and future decisions that should stay in
context as the MVP grows.

## Current Concerns

### Seller Onboarding Needs A Clear First Step

The `Quiero vender` path should not send non-technical sellers directly into a
form without context. Sellers need to understand the flow before they register:

- register the business;
- use the same email every time;
- enter the private panel from `/panel`;
- upload products from the panel;
- share public seller and product pages with buyers.

The MVP should keep `/vender` as the friendly onboarding entry point, then send
sellers to `/registro` when they are ready.

### Branded Login Email

Supabase Auth emails should not feel generic. Sellers should receive email that
clearly comes from YoComproLocal.

Short-term goal:

- Update Supabase Auth email templates with YoComproLocal wording.
- Use a clear sender name such as `YoComproLocal`.
- Use a friendly Spanish subject, for example:
  `Tu acceso a YoComproLocal`.
- Keep the email body very simple: explain that the link opens the seller panel.

Future production goal:

- Send from a domain email such as `hola@yocomprolocal.com.mx` or
  `acceso@yocomprolocal.com.mx`.
- Configure custom SMTP in Supabase.
- Configure SPF, DKIM, and DMARC for the domain before relying on branded email.

### Login For Non-Technical Sellers

Magic links are a good MVP foundation because they avoid passwords, but they may
still be confusing for small-business sellers who are not technical.

Keep for now:

- Email magic link login.
- Clear copy: "Revisa tu correo y abre el link para entrar a tu panel."
- A visible `/panel` entry point from the homepage.

Investigate later:

- Phone number login with a one-time code.
- WhatsApp code login.
- SMS OTP through Supabase Auth or Twilio.
- WhatsApp OTP through Meta, Twilio, or another approved provider.

Important tradeoffs:

- SMS and WhatsApp codes add cost.
- Deliverability varies by phone provider.
- WhatsApp provider setup can be slower than email.
- We need a fallback when a seller changes phone number or cannot receive a
  code.
- Phone login may feel more natural for local sellers, but email remains useful
  for account recovery and support.

### Product Page Access Must Be More Obvious

Sellers need to understand that every product has its own public page.

Improve soon:

- Product cards in the seller dashboard should make the public product page more
  obvious.
- Use clearer labels like `Ver página del producto` instead of only
  `Ver producto`.
- Add a visible `Copiar link` action near each product, not only inside the
  share kit.
- Draft products should clearly say they do not have a public page yet.
- Public seller pages should make each product card feel clickable while keeping
  the WhatsApp button easy to tap.

### Registration And First Dashboard Moment

The first seller moment should not mix buyer-style contact information with
seller setup instructions.

Keep improving:

- After registration, the primary action should be `Entrar a mi panel` or
  `Agregar mi primer producto`.
- Contact information should be secondary.
- The dashboard should clearly explain the difference between:
  - the seller's private panel;
  - the public seller page;
  - each public product page.
- If a seller logs in with the wrong email, the recovery path should explain
  that the business is connected to the original registration email.

## Product Principles

- Spanish-first.
- Mobile-first.
- WhatsApp-first.
- No technical language for sellers.
- Seller tasks should feel like "copy, share, upload photo" rather than
  "configure, manage, publish state."
- Avoid hiding important seller actions inside secondary sections.

## Recommended Next Prompt

Title: `Seller Onboarding QA And Auth Email Branding`

Goal:

Verify the full seller onboarding path in production and prepare the Supabase
Auth email template so sellers receive a YoComproLocal-branded access message.

Scope:

- Test `/vender -> /registro -> /entrar -> /panel`.
- Confirm wrong-email recovery is understandable.
- Confirm expired-link recovery is understandable.
- Draft Supabase Auth email subject/body with YoComproLocal language.
- Confirm production `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs.
- Do not add SMS, WhatsApp OTP, payments, shipping, or admin approval yet.
