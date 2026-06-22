# Friendlier Missing And Error States

Replace default-looking missing pages with warm, local YoComproLocal copy.

The goal is to help buyers and sellers recover when a product, store, panel, or unknown route is not found. Missing states should feel human, explain what may have happened, and provide clear links back into the marketplace.

## Scope

- Add a shared missing-state screen with YoComproLocal branding.
- Add a general app-level `not-found` page.
- Add route-specific missing states for:
  - public seller/store pages;
  - public product pages;
  - private seller panel pages.
- Product missing state should say `No encontramos este producto`.
- Include clear links back to the store/catalog where possible.

## Acceptance Criteria

- Unknown routes no longer show the default Next.js 404 screen.
- Missing product pages show human Spanish copy and links to the seller store and product catalog.
- Missing seller pages link back to seller discovery and login.
- Missing panel pages guide sellers back to the login/onboarding flow.
- Existing `notFound()` behavior still works.
