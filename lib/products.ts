import { createProductSlug } from "@/lib/slugs";

export type ProductRecord = {
  id: string;
  seller_slug: string | null;
  title: string | null;
  slug: string | null;
  price: number | string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
};

export const PRODUCT_CATEGORIES = [
  "Comida",
  "Artesanías",
  "Belleza",
  "Servicios",
  "Hogar",
  "Moda",
] as const;

export function createProductRecordSlug(title: string) {
  return createProductSlug(title);
}

export function formatProductPrice(price: ProductRecord["price"]) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return "Precio por confirmar";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}
