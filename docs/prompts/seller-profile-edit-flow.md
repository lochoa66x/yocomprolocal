# Seller Profile Edit Flow Prompt

## Goal

Let sellers update their business profile from the seller dashboard so their
public page stays accurate.

## Prompt

Add a seller profile edit flow to YoComproLocal.

Build route:

`/panel/vendedor/[slug]/perfil`

The profile edit page should:

- Fetch the seller by slug using the existing seller slug logic.
- Prefill business name, email, WhatsApp, zone, and description.
- Allow the seller to update those fields.
- Save changes to Supabase.
- If the business name changes, compute the new seller slug from the updated
  name.
- Update all products for that seller so their `seller_slug` changes to the new
  slug.
- Redirect to `/panel/vendedor/[newSlug]?perfil=actualizado`.
- Keep old route behavior safe by returning 404 if no seller is found.

Update the seller dashboard so it includes:

- A clear `Editar perfil` CTA in the hero.
- A secondary `Editar perfil` CTA in the profile/sidebar card.
- A success message when `?perfil=actualizado` exists:
  `Perfil actualizado. Tu página pública ya muestra los cambios.`

Keep the interface Spanish-first, mobile-friendly, warm, and simple for a
non-technical seller.

Do not add:

- Authentication
- Payments
- Shipping
- Inventory management
- Admin approval
- Database schema changes

## Acceptance Criteria

- `/panel/vendedor/la-cocina-de-maria/perfil` loads.
- Form is prefilled with seller data.
- Saving updates seller data in Supabase.
- If seller name changes, product `seller_slug` values update too.
- Saving redirects to `/panel/vendedor/[newSlug]?perfil=actualizado`.
- Dashboard has an `Editar perfil` CTA.
- Dashboard shows success message for `perfil=actualizado`.
- TypeScript passes.
