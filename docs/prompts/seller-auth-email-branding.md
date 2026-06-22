# Seller Auth Email Branding Prompt

Create a production-ready YoComproLocal seller access email guide.

The goal is to make seller login feel branded, human, and easy to understand
without changing the current magic-link implementation.

Implement:

- A dedicated Supabase Auth email template guide.
- A clear sender-name recommendation.
- A future domain sender recommendation.
- A Spanish subject line that sounds like YoComproLocal.
- A friendly Spanish body for non-technical sellers.
- A copy-paste HTML template for the Supabase Magic Link email.
- Notes for the case where Supabase Source editing is grayed out.
- QA steps to confirm the email returns to the production site and opens the
  seller panel.
- Links from the production auth QA doc, Supabase setup doc, and README.

Keep the MVP boundaries tight:

- Do not add SMS login.
- Do not add WhatsApp OTP login.
- Do not change the auth code unless the current flow is broken.
- Do not add buyer accounts.
- Do not add payments, shipping, or admin approval.

Acceptance test:

1. The docs explain where to configure the Magic Link email in Supabase.
2. The docs explain that custom SMTP is needed for full email branding.
3. The recommended subject is `Tu acceso a YoComproLocal`.
4. The email body clearly tells sellers to open their private panel.
5. The link target keeps sellers on `https://yocomprolocal.com.mx/auth/callback`.
6. The production auth runbook links to the branded email guide.
