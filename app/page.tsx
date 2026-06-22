import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import HomePageClient, { type FeaturedProduct } from "@/app/HomePageClient";
import {
  createProductRecordSlug,
  formatProductPrice,
  getProductCardDescription,
  type ProductRecord,
} from "@/lib/products";
import {
  getInitials,
  getSellerRecordSlug,
  getSellersBySlug,
  getWhatsAppHref,
  type SellerRecord,
} from "@/lib/storefront";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import type { FeaturedSeller } from "@/app/HomePageClient";

type Props = {
  searchParams: Promise<{
    code?: string;
    next?: string;
  }>;
};

function getSafeNextPath(nextPath: string | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/panel";
  }

  return nextPath;
}

function getAuthCallbackFallbackHref({
  code,
  nextPath,
}: {
  code?: string;
  nextPath?: string;
}) {
  const authCode = code?.trim();

  if (!authCode) {
    return null;
  }

  const params = new URLSearchParams({
    code: authCode,
    next: getSafeNextPath(nextPath),
  });

  return `/auth/callback?${params.toString()}`;
}

async function getLatestPublishedProducts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, seller_slug, title, slug, price, category, description, image_url"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Supabase featured products error:", error);
    return [];
  }

  return (data ?? []) as ProductRecord[];
}

async function getPublishedProductCounts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("products")
    .select("seller_slug")
    .eq("status", "published")
    .limit(1000);

  if (error) {
    console.error("Supabase featured seller product count error:", error);
    return {};
  }

  return ((data ?? []) as { seller_slug: string | null }[]).reduce<
    Record<string, number>
  >((counts, product) => {
    const sellerSlug = product.seller_slug?.trim();

    if (sellerSlug) {
      counts[sellerSlug] = (counts[sellerSlug] ?? 0) + 1;
    }

    return counts;
  }, {});
}

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  await connection();

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    return [];
  }

  const [products, sellersBySlug] = await Promise.all([
    getLatestPublishedProducts(supabase),
    getSellersBySlug(supabase),
  ]);

  return products
    .flatMap<FeaturedProduct>((product) => {
      const sellerSlug = String(product.seller_slug ?? "").trim();
      const seller = sellersBySlug[sellerSlug];
      const sellerName = seller?.name?.trim();

      if (!sellerSlug || !sellerName) {
        return [];
      }

      const title = product.title?.trim() || "Producto local";
      const category = product.category?.trim() || "Producto local";
      const description =
        product.description?.trim() || "Producto publicado en YoComproLocal.";
      const productSlug =
        product.slug?.trim() || createProductRecordSlug(title);

      return [
        {
          id: product.id,
          title,
          category,
          priceLabel: formatProductPrice(product.price),
          description: getProductCardDescription(description),
          imageUrl: product.image_url,
          sellerName,
          sellerZone: seller.zona?.trim() || "Cuautitlán Izcalli",
          productHref: `/vendedor/${sellerSlug}/producto/${productSlug}`,
          sellerHref: `/vendedor/${sellerSlug}`,
          whatsappHref: seller.whatsapp
            ? getWhatsAppHref(seller.whatsapp, sellerName, title)
            : null,
        },
      ];
    })
    .slice(0, 3);
}

function getFeaturedSellerDescription(seller: SellerRecord) {
  const description =
    seller.description?.trim() || "Negocio local listo para atender por WhatsApp.";

  if (description.length <= 120) {
    return description;
  }

  const shortened = description.slice(0, 120).replace(/\s+\S*$/, "");

  return `${shortened || description.slice(0, 120).trimEnd()}...`;
}

function getFeaturedSellerProductLabel(productCount: number) {
  if (productCount === 1) {
    return "1 producto publicado";
  }

  return `${productCount} productos publicados`;
}

async function getFeaturedSellers(): Promise<FeaturedSeller[]> {
  await connection();

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    return [];
  }

  const [sellersBySlug, productCountsBySellerSlug] = await Promise.all([
    getSellersBySlug(supabase),
    getPublishedProductCounts(supabase),
  ]);

  return Object.entries(sellersBySlug)
    .flatMap<FeaturedSeller>(([sellerSlug, seller]) => {
      const sellerName = seller.name?.trim();
      const usableSellerSlug = sellerSlug || getSellerRecordSlug(seller);
      const productCount = productCountsBySellerSlug[usableSellerSlug] ?? 0;

      if (!sellerName || !usableSellerSlug || productCount <= 0) {
        return [];
      }

      return [
        {
          id: seller.id ?? usableSellerSlug,
          initials: getInitials(sellerName),
          name: sellerName,
          zone: seller.zona?.trim() || "Cuautitlán Izcalli",
          description: getFeaturedSellerDescription(seller),
          productCountLabel: getFeaturedSellerProductLabel(productCount),
          sellerHref: `/vendedor/${usableSellerSlug}`,
          whatsappHref: seller.whatsapp
            ? getWhatsAppHref(seller.whatsapp, sellerName)
            : null,
        },
      ];
    })
    .sort((firstSeller, secondSeller) =>
      firstSeller.name.localeCompare(secondSeller.name, "es")
    )
    .slice(0, 3);
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const authCallbackFallbackHref = getAuthCallbackFallbackHref({
    code: params.code,
    nextPath: params.next,
  });

  if (authCallbackFallbackHref) {
    redirect(authCallbackFallbackHref);
  }

  const [featuredProducts, featuredSellers] = await Promise.all([
    getFeaturedProducts(),
    getFeaturedSellers(),
  ]);

  return (
    <HomePageClient
      featuredProducts={featuredProducts}
      featuredSellers={featuredSellers}
    />
  );
}
