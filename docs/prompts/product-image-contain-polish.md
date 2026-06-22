# Product Image Contain Polish

## Prompt

Improve product image presentation across YoComproLocal.

Product photos should be centered and shown fully when possible, especially tall or narrow product photos like bottles. Avoid harsh cropping. Use a clean framed image area with object-fit contain, centered image placement, and a soft background/fill color so empty space feels intentional instead of broken.

Apply this through the shared `ProductImageFrame` component so product cards, seller storefront product grids, product detail pages, dashboard previews, and homepage featured products all benefit from the same behavior.

Keep the UI warm, local, and polished. Do not change database schema, storage logic, upload logic, or product data.

## Acceptance Criteria

- Uploaded product images are centered in their frame.
- Tall or narrow images are displayed with `contain` behavior instead of aggressive cropping.
- Empty areas around contained images use a soft, product-like background treatment.
- The existing category badge still works.
- The change is centralized in the shared product image component.
- The production build still passes.

## Implementation Notes

- Product images use a centered `object-contain` treatment through `ProductImageFrame`.
- The frame uses a blurred copy of the product photo as the background fill, so empty space feels intentional and visually connected to the uploaded image.
- Category badges sit at the top of the image frame to avoid covering the bottom of tall product photos.
