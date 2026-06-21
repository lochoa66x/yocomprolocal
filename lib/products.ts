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

export function getProductCardDescription(description: string) {
  const maxLength = 150;
  const trimmed = description.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const shortened = trimmed.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${shortened || trimmed.slice(0, maxLength).trimEnd()}...`;
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
