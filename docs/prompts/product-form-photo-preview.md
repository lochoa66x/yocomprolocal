# Product Form Photo Preview

Improve the seller product form so uploading a photo feels natural and safe.

When a seller chooses a product photo, show an immediate preview before they publish or save changes. Reuse the existing centered product image frame so tall or narrow photos are not harshly cropped, and keep the copy simple for non-technical sellers.

## Scope

- Add a reusable client-side photo preview field for product forms.
- Support previewing a selected local file before upload.
- Support previewing an existing or pasted image URL.
- Allow the seller to remove the selected local file before submitting.
- Use the same preview experience on:
  - `/producto/nuevo`
  - `/panel/vendedor/[slug]/producto/[productSlug]/editar`

## Acceptance Criteria

- A seller sees a preview immediately after choosing a product photo.
- The preview starts with the current product image on the edit form.
- The preview uses the existing centered image frame treatment.
- The original server actions still receive `imageFile` and `imageUrl`.
- Product creation and editing still validate image type and image size on submit.
