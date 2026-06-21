# Product Edit Flow Prompt

## Goal

Let sellers update existing products from their dashboard so YoComproLocal feels
like a usable seller tool, not only a publishing demo.

## Prompt

Add a product edit flow to YoComproLocal.

Build route:

`/panel/vendedor/[slug]/producto/[productSlug]/editar`

The edit page should:

- Fetch the seller and product from Supabase.
- Prefill title, price, category, description, status, and image URL.
- Show a preview area using the existing image or the gradient fallback.
- Allow replacing the product photo with a new upload.
- Reuse the existing product image upload helper.
- Reuse the existing product AI assistant.
- Let the seller switch status between `published` and `draft`.
- Update the product in Supabase.
- Redirect back to `/panel/vendedor/[slug]?producto=actualizado`.

Update the seller dashboard so each product card includes:

- `Editar` link to the edit page.
- Existing public product link when published.
- Existing WhatsApp link when available.
- Existing add another product CTA.

The dashboard should show a warm success message when
`?producto=actualizado` exists:

`Producto actualizado. Tu vitrina ya muestra los cambios.`

Do not add:

- Authentication
- Payments
- Shipping
- Inventory management
- Admin approval
- Database schema changes

## Acceptance Criteria

- `/panel/vendedor/la-cocina-de-maria/producto/tamales-caseros/editar` loads.
- The edit form is prefilled with product data.
- Saving updates the product in Supabase.
- Saving redirects to `/panel/vendedor/la-cocina-de-maria?producto=actualizado`.
- Dashboard product cards include an `Editar` action.
- The dashboard success message appears for `producto=actualizado`.
- TypeScript passes.
