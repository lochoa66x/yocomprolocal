# Seller Product Management Actions

## Prompt

Improve the YoComproLocal seller dashboard so small business owners can clearly manage each product after upload.

Focus on the private seller panel at `/panel/vendedor/[slug]`. Each product card should make the main actions obvious and beginner-friendly:

- See whether the product is public or still a draft.
- Open the public product page when published.
- Edit the product.
- Share the product link or ready-to-send message.
- Delete the product through the existing protected delete confirmation flow.
- Publish a draft or hide a published product without confusing the seller.

Also improve the empty product state so the first product path feels guided, and make the main add-product CTA change from “Agrega tu primer producto” to “Agregar otro producto” once the seller has products.

Keep this scoped to UI and existing dashboard behavior. Do not add new tables, auth changes, or admin approval.

## Acceptance Criteria

- The dashboard product cards show clear labels for public view, edit, share, delete, and publish/draft actions.
- Draft products clearly explain that buyers cannot see them yet.
- Published products show a public product URL and sharing controls.
- The delete action still routes to the existing confirmation screen.
- The empty state explains the first product flow in simple Spanish.
- The primary add-product CTA adapts based on whether the seller already has products.
