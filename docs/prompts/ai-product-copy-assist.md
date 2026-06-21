# AI Product Copy Assist Prompt

Build AI product copy assistance for YoComproLocal.

Add an MVP AI helper to the product creation flow at `/producto/nuevo`.

The seller should be able to enter rough product information and receive Spanish-first selling copy suggestions.

Generate:

- Improved product title.
- Polished product description.
- WhatsApp sales message.
- Short social media caption.
- Tags.

Keep it seller-friendly, local, warm, simple, and non-technical.

Do not replace the seller's text automatically. Show suggestions first so the seller can copy or manually use them.

Use the OpenAI API from a server-side route only. Never expose the API key to the browser.

Add required env var documentation:

`OPENAI_API_KEY`

Optional env var:

`OPENAI_MODEL`

Avoid:

- Payments.
- Checkout.
- Shipping.
- Inventory.
- Admin approval changes.
- Complex AI workflows.

Acceptance test:

1. Visit `/producto/nuevo?seller=la-cocina-de-maria`.
2. Enter rough product info.
3. Click AI assist.
4. Confirm the app shows title, description, WhatsApp message, caption, and tags.
5. Confirm product publishing still works normally.
