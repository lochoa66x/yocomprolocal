import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { formatProductPrice, type ProductRecord } from "@/lib/products";
import {
  getInitials,
  getProductImageStyle,
  getSellerBySlug,
  getWhatsAppHref,
  type SellerRecord,
} from "@/lib/storefront";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

type ProductPageData = {
  seller: SellerRecord;
  product: ProductRecord;
};

type Props = {
  params: Promise<{ slug: string; productSlug: string }>;
};

export const metadata: Metadata = {
  title: "Producto local | YoComproLocal",
  description:
    "Página pública de producto local en YoComproLocal para contactar directo por WhatsApp.",
};

async function getPublishedProduct(
  sellerSlug: string,
  productSlug: string
): Promise<ProductPageData | null> {
  await connection();

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    return null;
  }

  const seller = await getSellerBySlug(supabase, sellerSlug);

  if (!seller) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, seller_slug, title, slug, price, category, description, image_url"
    )
    .eq("seller_slug", sellerSlug)
    .eq("slug", productSlug)
    .eq("status", "published")
    .limit(1);

  if (error) {
    console.error("Supabase product detail error:", error);
    return null;
  }

  const product = ((data ?? []) as ProductRecord[])[0];

  if (!product) {
    return null;
  }

  return {
    seller,
    product,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug: sellerSlug, productSlug } = await params;
  const pageData = await getPublishedProduct(sellerSlug, productSlug);

  if (!pageData) {
    notFound();
  }

  const { seller, product } = pageData;
  const sellerName = seller.name?.trim();

  if (!sellerName) {
    notFound();
  }

  const title = product.title?.trim() || "Producto local";
  const category = product.category?.trim() || "Producto local";
  const description =
    product.description?.trim() || "Producto publicado en YoComproLocal.";
  const zona = seller.zona?.trim() || "Cuautitlán Izcalli";
  const imageStyle = getProductImageStyle(product.image_url);
  const productWhatsAppHref = seller.whatsapp
    ? getWhatsAppHref(seller.whatsapp, sellerName, title)
    : null;

  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <section className="border-b border-[#dce4d6] bg-[#173a2a] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <a
            href="/"
            className="flex min-w-0 items-center gap-3 font-semibold"
            aria-label="YoComproLocal inicio"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-black text-[#214e34] shadow-sm">
              YCL
            </span>
            <span className="hidden text-lg tracking-wide min-[420px]:inline">
              YoComproLocal
            </span>
          </a>
          <a
            href={`/vendedor/${sellerSlug}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/35 px-4 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Ver vendedor
          </a>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div
            className="relative flex min-h-[390px] overflow-hidden rounded-lg border border-[#dbe5d6] bg-[linear-gradient(135deg,#f6c55f_0%,#e37852_48%,#2f7c5b_100%)] bg-cover bg-center shadow-[0_18px_45px_rgba(31,52,41,0.12)] sm:min-h-[560px]"
            style={imageStyle}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#173a2a]/62 via-transparent to-transparent" />
            <span className="relative mb-5 ml-5 mt-auto rounded-full bg-white/92 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#214e34]">
              {category}
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
              Producto local
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-[#1f3429] sm:text-6xl">
              {title}
            </h1>
            <p className="mt-5 text-3xl font-black text-[#c05635]">
              {formatProductPrice(product.price)}
            </p>
            <p className="mt-6 text-lg leading-8 text-[#53645a]">
              {description}
            </p>

            {productWhatsAppHref ? (
              <a
                href={productWhatsAppHref}
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-6 text-base font-black text-[#102318] shadow-sm transition hover:bg-[#39df78] sm:w-auto"
              >
                Preguntar por WhatsApp
              </a>
            ) : (
              <p className="mt-8 rounded-lg bg-[#eef5ec] p-4 text-sm font-semibold leading-6 text-[#53645a]">
                Este vendedor todavía no agregó WhatsApp público.
              </p>
            )}

            <section className="mt-8 rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#567164]">
                Vendedor
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e8] text-lg font-black text-[#214e34]">
                  {getInitials(sellerName)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-[#1f3429]">
                    {sellerName}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[#6a7a70]">
                    {zona}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
