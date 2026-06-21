# Seller Readiness Dashboard Prompt

Add a seller-readiness checklist to the protected YoComproLocal seller dashboard.

The goal is to help non-technical sellers know exactly what to do after they
log in, without creating a heavier admin system or adding new database tables.

Implement:

- A dashboard readiness panel inside `/panel/vendedor/[slug]`.
- A progress count based on simple MVP signals:
  - profile has name, email, WhatsApp, zone, and description;
  - seller has at least one product;
  - at least one product has a real photo;
  - at least one product is published;
  - profile plus WhatsApp plus a published product are ready for sharing.
- A "next best action" button based on the first incomplete step.
- Compact checklist cards that show completed and pending steps.
- Action links to edit profile, add product, upload product photo, view a public
  product page, or share the public seller page.

Keep the MVP boundaries tight:

- No new tables.
- No buyer accounts.
- No payments.
- No admin approval changes.
- No analytics events yet.
- No gamification beyond a simple progress count.

Acceptance test:

1. Visit a protected seller dashboard.
2. Confirm the readiness panel appears above product management.
3. Confirm the completed count changes based on profile/product state.
4. Confirm the next action points to the correct existing flow.
5. Confirm sellers can still edit products and add products normally.
