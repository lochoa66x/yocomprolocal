# Registration Success Onboarding Prompt

## Goal

Connect seller registration to the storefront onboarding flow so a new seller has an obvious next step after submitting the form.

## Prompt

After a seller submits `/registro` successfully, compute their seller slug from the business name and redirect to:

`/registro?success=1&seller={slug}`

On the success screen, show a warm confirmation and three clear actions:

- `Ver mi perfil`
- `Agregar mi primer producto`
- `Copiar enlace de mi tienda`

Use the existing seller slug convention, existing routes, and current YoComproLocal visual style.

Do not add authentication, admin approval, payments, shipping, dashboards, or inventory management in this step.

## Acceptance Criteria

- A new registration redirects with a seller slug in the URL.
- The seller can open their public profile from the success screen.
- The seller can go directly to the product creation form with the seller slug prefilled in the URL.
- The seller can copy their public store link.
- Existing `/registro?success=1&slug={slug}` URLs still work.
