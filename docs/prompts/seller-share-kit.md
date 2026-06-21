# Seller Share Kit Prompt

Add a simple seller share kit to the protected YoComproLocal dashboard.

The goal is to help sellers move from "I published a product" to "I can share
this with customers right now" without needing marketing skills or another
tool.

Implement:

- A share kit section inside `/panel/vendedor/[slug]`.
- A seller-page share card with:
  - public seller URL;
  - copy link button;
  - copy-ready WhatsApp intro message.
- Product share cards for the latest published products, with:
  - public product link;
  - price;
  - copy link button;
  - copy-ready WhatsApp sales message;
  - copy-ready short caption for social posts or local groups.
- A fallback state when the seller has no published products yet.
- Reuse the existing client copy button instead of introducing a new UI system.

Keep the MVP boundaries tight:

- No analytics yet.
- No social platform integrations.
- No scheduling.
- No AI call in this step.
- No new tables.
- No buyer accounts.

Acceptance test:

1. Visit a protected seller dashboard.
2. Confirm the seller share card shows the public seller URL.
3. Confirm published products show share cards.
4. Copy a product link, WhatsApp message, and caption.
5. Confirm sellers can still add and edit products normally.
