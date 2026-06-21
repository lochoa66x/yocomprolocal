import type { SupabaseClient } from "@supabase/supabase-js";
import { createSellerSlug } from "@/lib/slugs";

export type SellerRecord = {
  name: string | null;
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

export async function getSellerBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  const { data, error } = await supabase
    .from("sellers")
    .select("name, whatsapp, zona, description")
    .limit(200);

  if (error) {
    console.error("Supabase seller lookup error:", error);
    return null;
  }

  const sellers = (data ?? []) as SellerRecord[];

  return (
    sellers.find((candidate) => {
      const name = String(candidate.name ?? "").trim();
      return name && createSellerSlug(name) === slug;
    }) ?? null
  );
}
