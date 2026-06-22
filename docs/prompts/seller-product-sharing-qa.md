# Seller Product Sharing QA Prompt

Make the seller dashboard product-sharing path obvious from each private
product card.

The goal is for a seller to publish a product and immediately know which link or
message to send to customers, without opening a separate section first.

Implement:

- In each published dashboard product card, show the public product URL.
- Show a ready-to-send WhatsApp message for that product.
- Add direct actions to:
  - open the public product page;
  - copy the public product link;
  - share the product through WhatsApp;
  - copy the WhatsApp message.
- Keep draft products clearly marked as private.
- Keep edit, publish/unpublish, and delete actions available.
- Reuse the existing copy button and current dashboard styling.

Keep the MVP boundaries tight:

- No analytics.
- No buyer accounts.
- No social API integrations.
- No new database tables.
- No AI calls in this step.

Acceptance test:

1. Open `/panel/vendedor/[slug]` as the seller.
2. Confirm a published product shows its public URL.
3. Confirm the product card has `Copiar link publico`.
4. Confirm the product card has `Compartir por WhatsApp`.
5. Confirm the product card has `Copiar mensaje`.
6. Confirm a draft product does not expose a public sharing action.
