import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import HomePageClient, { type FeaturedProduct } from "@/app/HomePageClient";
import {
  createProductRecordSlug,
  formatProductPrice,
  getProductCardDescription,
  type ProductRecord,
} from "@/lib/products";
import { getSellersBySlug, getWhatsAppHref } from "@/lib/storefront";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

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

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return <HomePageClient featuredProducts={featuredProducts} />;
}
