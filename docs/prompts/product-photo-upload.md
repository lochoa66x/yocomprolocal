# Product Photo Upload Prompt

Build the first real product-photo workflow for YoComproLocal.

The goal is to move the MVP from placeholder product cards to real seller-uploaded product photos, while keeping the flow simple enough for non-technical local sellers.

Implement:

- A Supabase Storage bucket named `product-images`.
- Public read access for uploaded product images.
- A reusable server-side upload helper for product images.
- File validation for image type and file size before uploading.
- A `/producto/nuevo` form field that lets the seller upload an image from their device.
- A fallback manual image URL field for debugging or temporary imports.
- Product save logic that stores the final public image URL in `products.image_url`.
- Seller product cards that immediately render the uploaded product image.

Keep the MVP boundaries tight:

- No authentication yet.
- No payments.
- No inventory.
- No shipping.
- No AI generation in this step.
- No admin approval changes in this step.

Acceptance test:

1. Create the `product-images` bucket in Supabase.
2. Visit `/producto/nuevo?seller=la-cocina-de-maria`.
3. Upload a small JPG, PNG, WebP, or GIF.
4. Publish the product.
5. Land back on `/vendedor/la-cocina-de-maria`.
6. Confirm the new product card displays the uploaded photo.
