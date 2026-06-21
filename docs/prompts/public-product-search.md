# Public Product Search Prompt

## Goal

Make the public product catalog easier for buyers to use by adding text search.

## Prompt

Add buyer search to the public product discovery page.

On `/productos`, add a search field that uses a query param like:

`/productos?q=tacos`

Search should match:

- Product title
- Product description
- Category
- Seller name
- Seller zone

Keep category filtering working too, so:

`/productos?categoria=Comida&q=tacos`

filters by both category and search.

Update the page header, count, and empty state so they reflect the current search and category.

Keep the design mobile-first and consistent with YoComproLocal. Do not add authentication, payments, cart, checkout, admin workflows, or database schema changes.

## Acceptance Criteria

- `/productos?q=tacos` filters products by buyer search text.
- Search works together with `/productos?categoria=Comida`.
- Search matches product and seller fields.
- The empty state explains when no search results were found.
- Buyers can clear search and category filters.
