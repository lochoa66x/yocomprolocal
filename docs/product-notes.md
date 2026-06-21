# YoComproLocal Product Notes

These notes capture product concerns and future decisions that should stay in
context as the MVP grows.

## Current Concerns

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

Improve soon:

- After registration, the primary action should be `Entrar a mi panel` or
  `Agregar mi primer producto`.
- Contact information should be secondary.
- The dashboard should clearly explain the difference between:
  - the seller's private panel;
  - the public seller page;
  - each public product page.

## Product Principles

- Spanish-first.
- Mobile-first.
- WhatsApp-first.
- No technical language for sellers.
- Seller tasks should feel like "copy, share, upload photo" rather than
  "configure, manage, publish state."
- Avoid hiding important seller actions inside secondary sections.

## Recommended Next Prompt

Title: `Seller Access And Product Page Clarity Polish`

Goal:

Make it obvious where sellers go to manage their business, where buyers see
their public page, and where each product page can be opened or copied.

Scope:

- Improve dashboard labels for public product pages.
- Add direct copy-link actions beside each product card.
- Improve registration success/dashboard copy so "private panel" and "public
  page" are clearly separated.
- Keep the current magic-link auth flow, but make the wording more seller
  friendly.
- Do not add SMS, WhatsApp OTP, payments, shipping, or admin approval in this
  step.
