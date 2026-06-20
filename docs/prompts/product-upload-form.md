# Product Upload Form Prompt

Create the first real YoComproLocal seller workflow by adding a polished `/producto/nuevo` product upload page.

Keep it MVP-simple but production-minded:

- Sellers can enter their seller slug, product title, price, category, description, and optional image URL.
- Generate a clean product slug automatically.
- Save the product to Supabase as `published`.
- Handle duplicate product names gracefully by updating the existing product for that seller.
- Redirect back to the seller's public storefront so the seller immediately sees the product live.

Do not add payments, shipping, inventory, authentication, or AI generation in this step.
