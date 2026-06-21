# Registration Dashboard Entry Prompt

## Goal

Make registration feel like the start of the seller workflow by sending new
sellers to their dashboard.

## Prompt

Improve the YoComproLocal registration flow so the seller dashboard becomes the
main place sellers go after registering.

After a seller submits `/registro` successfully:

- Compute the seller slug from the business name.
- Redirect to `/panel/vendedor/[sellerSlug]?registro=creado`.
- Show a server-rendered success message on the dashboard when
  `registro=creado` exists.
- The success message should encourage the seller to add their first product.
- Keep the existing registration success page useful for old
  `/registro?success=1&seller=[sellerSlug]` links.
- Add an `Ir a mi panel` CTA to the legacy registration success actions.
- Keep the existing links to public profile, first product creation, and copy
  public seller link.

Do not add:

- Authentication
- Payments
- Shipping
- Admin approval
- Database schema changes

## Acceptance Criteria

- A successful registration redirects to
  `/panel/vendedor/la-cocina-de-maria?registro=creado`.
- The seller dashboard shows a warm registration success message for that query.
- The dashboard still works without `registro=creado`.
- Legacy `/registro?success=1&seller=la-cocina-de-maria` still works.
- The legacy success screen includes a dashboard CTA.
- TypeScript passes.
