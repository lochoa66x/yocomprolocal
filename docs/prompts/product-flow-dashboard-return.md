# Product Flow Dashboard Return Prompt

## Goal

Make the seller workflow feel intentional by returning sellers to their
dashboard after they publish a product.

## Prompt

Improve the product creation flow for YoComproLocal.

After a seller creates or uploads a product from `/producto/nuevo`, redirect
them to their seller dashboard instead of the public seller page.

Update the flow so that:

- Successful product creation redirects to `/panel/vendedor/[sellerSlug]`.
- The success redirect includes `?producto=creado`.
- The dashboard shows a warm success message when that query param exists.
- The success message says:
  `Producto publicado. Ya puedes compartirlo con tus clientes.`
- The success message is rendered on the server and does not require
  JavaScript.
- The product creation page header includes `Volver al panel`.
- The product creation page still includes a secondary link to the public
  profile.
- Error redirects keep the seller slug in the URL whenever available.
- Existing image upload, AI copy assistant, Supabase upsert, and validation
  behavior stay unchanged.

Do not add:

- Authentication
- Payments
- Shipping
- Inventory
- Admin approval
- Database schema changes

## Acceptance Criteria

- Creating a product redirects to
  `/panel/vendedor/la-cocina-de-maria?producto=creado`.
- Dashboard shows the success message only when `producto=creado` exists.
- Dashboard still works normally without the query param.
- `/producto/nuevo?seller=la-cocina-de-maria` still works.
- Error states preserve `seller=la-cocina-de-maria` when possible.
- TypeScript passes.
