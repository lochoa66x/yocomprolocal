# Seller Access And Product Page Clarity Polish Prompt

Improve YoComproLocal so non-technical sellers clearly understand the
difference between their private panel, their public seller page, and each
public product page.

Implement:

- Friendlier login copy that avoids technical language like "magic link".
- Registration success copy that points sellers first to their private panel.
- Clear labels for:
  - private seller panel;
  - public seller page;
  - public product page.
- A dashboard explanation that customers do not see the private panel.
- Product cards in the dashboard with:
  - a clear public product page URL when published;
  - a direct copy-link action near the product;
  - a clearer draft explanation when the product is not public.
- Public seller page copy that feels buyer-facing, not like a seller setup
  screen.

Do not add:

- SMS login.
- WhatsApp OTP login.
- Payments.
- Shipping.
- Admin approval.
- New database tables.

Acceptance test:

1. The login page says "enlace por correo" instead of "link mágico".
2. Registration success points sellers to the private panel first.
3. The seller dashboard explains that the panel is private.
4. Published dashboard product cards show and copy a public product link.
5. Draft dashboard product cards explain that customers cannot see the product.
6. Public seller pages use buyer-facing language and product page labels.
7. TypeScript passes.
