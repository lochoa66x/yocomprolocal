# Seller Panel Entry Prompt

Create the first real seller portal entry for YoComproLocal.

The goal is to make seller login feel like a normal account experience instead
of requiring sellers to remember a private dashboard URL.

Implement:

- A generic `/panel` route.
- If the visitor is logged out, redirect to `/entrar?next=/panel`.
- If the visitor is logged in and owns a seller profile, redirect to
  `/panel/vendedor/[slug]`.
- If the visitor is logged in with an email that matches an unclaimed seller,
  claim that seller and redirect to its dashboard.
- If the visitor is logged in but has no seller profile, show a friendly screen
  with actions to register a business or change email.
- If a logged-in visitor registers a business with the same email, attach the
  new seller profile to that active account and send them straight to the panel.
- Update `/entrar` so its default post-login destination is `/panel`.
- Add homepage links for returning sellers: "Mi panel" / "Seller login".

Keep the MVP boundaries tight:

- No buyer accounts.
- No passwords.
- No multi-seller switching yet.
- No billing.
- No admin workflow changes.

Acceptance test:

1. Visit `/panel` while logged out.
2. Confirm it redirects to `/entrar?next=/panel`.
3. Log in with a seller email.
4. Confirm `/panel` redirects to that seller dashboard.
5. Log in with an email that has no seller profile.
6. Confirm `/panel` shows a register-business path instead of a 404.
