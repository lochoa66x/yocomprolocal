function createSlug(value: string, fallback: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

export function createSellerSlug(value: string) {
  return createSlug(value, "vendedor-local");
}

export function createProductSlug(value: string) {
  return createSlug(value, "producto-local");
}
