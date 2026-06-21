# Seller First-Run Dashboard Checklist

## Prompt

Improve the protected seller dashboard so a first-time seller immediately knows
what to do after entering their panel.

## Goal

Make the dashboard feel guided for non-technical local sellers. A seller should
understand the basic journey without needing training:

1. Complete the business profile.
2. Add the first product.
3. View the public seller page.
4. Copy a link/message for WhatsApp.
5. View the published product page.

## Scope

- Refine the existing readiness panel inside `/panel/vendedor/[slug]`.
- Use seller-friendly labels: `Primer recorrido`, `Paso 1`, `Paso 2`, etc.
- Keep the checklist driven by existing profile and product data.
- Add direct anchors to the share kit and product management sections.
- Keep the next-best-action button based on the first incomplete step.
- Keep public/private language clear for sellers.

## Out Of Scope

- New database tables.
- Tracking whether a seller actually copied a link.
- SMS or WhatsApp login.
- Admin approval.
- Payments, shipping, inventory, or marketplace commissions.

## Acceptance Test

1. Visit a protected seller dashboard.
2. Confirm the first-run checklist appears near the top of the panel.
3. Confirm the checklist uses five steps with clear actions.
4. Confirm the next action changes when profile/product state changes.
5. Confirm `Copiar link` jumps to the share kit.
6. Confirm existing product editing, publishing, and sharing still work.
