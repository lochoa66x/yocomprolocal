import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSellerSlug } from "@/lib/slugs";

const SELLER_SELECT =
  "id, slug, user_id, name, email, whatsapp, zona, description";

export type SellerRecord = {
  id: string | null;
  slug: string | null;
  user_id: string | null;
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

export function getSellerRecordSlug(seller: SellerRecord) {
  const storedSlug = seller.slug?.trim();
  const name = seller.name?.trim();

  if (storedSlug) {
    return storedSlug;
  }

  return name ? createSellerSlug(name) : "";
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
    .select(SELLER_SELECT)
    .limit(200);

  if (error) {
    console.error("Supabase seller lookup error:", error);
    return {};
  }

  const sellers = (data ?? []) as SellerRecord[];

  return sellers.reduce<Record<string, SellerRecord>>((lookup, seller) => {
    const slug = getSellerRecordSlug(seller);

    if (slug) {
      lookup[slug] = seller;
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

export async function getSellerByUser(
  supabase: SupabaseClient,
  user: User
) {
  const { data: ownedData, error: ownedError } = await supabase
    .from("sellers")
    .select(SELLER_SELECT)
    .eq("user_id", user.id)
    .limit(1);

  if (ownedError) {
    console.error("Supabase seller owner lookup error:", ownedError);
    return null;
  }

  const ownedSeller = ((ownedData ?? []) as SellerRecord[])[0];

  if (ownedSeller) {
    return ownedSeller;
  }

  const userEmail = user.email?.trim().toLowerCase();

  if (!userEmail) {
    return null;
  }

  const { data: claimData, error: claimError } = await supabase
    .from("sellers")
    .select(SELLER_SELECT)
    .ilike("email", userEmail)
    .limit(1);

  if (claimError) {
    console.error("Supabase seller email lookup error:", claimError);
    return null;
  }

  const claimableSeller = ((claimData ?? []) as SellerRecord[])[0];
  const claimableSlug = claimableSeller
    ? getSellerRecordSlug(claimableSeller)
    : "";

  if (!claimableSeller || !claimableSlug) {
    return null;
  }

  return getAuthorizedSellerBySlug({
    supabase,
    slug: claimableSlug,
    user,
  });
}

export async function getAuthorizedSellerBySlug({
  supabase,
  slug,
  user,
}: {
  supabase: SupabaseClient;
  slug: string;
  user: User;
}) {
  const seller = await getSellerBySlug(supabase, slug);

  if (!seller) {
    return null;
  }

  if (seller.user_id === user.id) {
    return seller;
  }

  if (seller.user_id) {
    return null;
  }

  const sellerEmail = seller.email?.trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();

  if (!sellerEmail || !userEmail || sellerEmail !== userEmail) {
    return null;
  }

  const sellerId = seller.id?.trim();
  const updateQuery = supabase
    .from("sellers")
    .update({
      user_id: user.id,
      updated_at: new Date().toISOString(),
    })
    .select(SELLER_SELECT)
    .limit(1);

  const { data, error } = sellerId
    ? await updateQuery.eq("id", sellerId)
    : await updateQuery.eq("email", sellerEmail);

  if (error) {
    console.error("Supabase seller claim error:", error);
    return seller;
  }

  return ((data ?? []) as SellerRecord[])[0] ?? {
    ...seller,
    user_id: user.id,
  };
}
