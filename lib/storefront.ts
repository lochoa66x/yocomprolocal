import type { SupabaseClient } from "@supabase/supabase-js";
import { createSellerSlug } from "@/lib/slugs";

export type SellerRecord = {
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  zona: string | null;
  description: string | null;
};

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getProductImageStyle(imageUrl: string | null) {
  const trimmedUrl = imageUrl?.trim();

  if (!trimmedUrl || !/^https?:\/\//.test(trimmedUrl)) {
    return undefined;
  }

  return {
    backgroundImage: `url(${trimmedUrl})`,
  };
}

export function getWhatsAppHref(
  whatsapp: string,
  sellerName: string,
  productTitle?: string
) {
  const digits = whatsapp.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const phone = digits.startsWith("52") ? digits : `52${digits}`;
  const message = productTitle
    ? `Hola, vi "${productTitle}" de ${sellerName} en YoComproLocal y me interesa.`
    : `Hola, vi el perfil de ${sellerName} en YoComproLocal y me interesa lo que vende.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function getSellersBySlug(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("sellers")
    .select("name, email, whatsapp, zona, description")
    .limit(200);

  if (error) {
    console.error("Supabase seller lookup error:", error);
    return {};
  }

  const sellers = (data ?? []) as SellerRecord[];

  return sellers.reduce<Record<string, SellerRecord>>((lookup, seller) => {
    const name = String(seller.name ?? "").trim();

    if (name) {
      lookup[createSellerSlug(name)] = seller;
    }

    return lookup;
  }, {});
}

export async function getSellerBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  const sellersBySlug = await getSellersBySlug(supabase);

  return sellersBySlug[slug] ?? null;
}
