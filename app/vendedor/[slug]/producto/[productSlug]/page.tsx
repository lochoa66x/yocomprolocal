import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { formatProductPrice, type ProductRecord } from "@/lib/products";
import { ProductImageFrame } from "@/components/product-image-frame";
import {
  getInitials,
  getSellerBySlug,
  getWhatsAppHref,
  type SellerRecord,
} from "@/lib/storefront";
import { getCanonicalSiteOrigin } from "@/lib/site-url";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

type ProductPageData = {
  seller: SellerRecord;
  product: ProductRecord;
};

type Props = {
  params: Promise<{ slug: string; productSlug: string }>;
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

function getValidImageUrl(imageUrl: string | null) {
  const trimmedUrl = imageUrl?.trim();

  if (!trimmedUrl || !/^https?:\/\//.test(trimmedUrl)) {
    return null;
  }

  return trimmedUrl;
}

function getMetadataDescription({
  description,
  price,
  sellerName,
  zona,
}: {
  description: string;
  price: ProductRecord["price"];
  sellerName: string;
  zona: string;
}) {
  const productDescription = description.replace(/\s+/g, " ").trim();
  const shortDescription =
    productDescription.length > 115
      ? `${productDescription.slice(0, 115).replace(/\s+\S*$/, "")}...`
      : productDescription;

  return `${shortDescription} ${formatProductPrice(
    price
  )}. Vende ${sellerName} en ${zona}.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: sellerSlug, productSlug } = await params;
  const pageData = await getPublishedProduct(sellerSlug, productSlug);

  if (!pageData) {
    return {
      title: "Producto local | YoComproLocal",
      description:
        "Producto local en YoComproLocal para escribir directo por WhatsApp.",
    };
  }

  const { seller, product } = pageData;
  const sellerName = seller.name?.trim() || "Negocio local";
  const title = product.title?.trim() || "Producto local";
  const description =
    product.description?.trim() || "Producto publicado en YoComproLocal.";
  const zona = seller.zona?.trim() || "Cuautitlán Izcalli";
  const productUrl = new URL(
    `/vendedor/${sellerSlug}/producto/${productSlug}`,
    getCanonicalSiteOrigin()
  ).toString();
  const imageUrl = getValidImageUrl(product.image_url);
  const metadataDescription = getMetadataDescription({
    description,
    price: product.price,
    sellerName,
    zona,
  });

  return {
    title: `${title} | ${sellerName} en YoComproLocal`,
    description: metadataDescription,
    openGraph: {
      title,
      description: metadataDescription,
      url: productUrl,
      siteName: "YoComproLocal",
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description: metadataDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
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
  const productHref = `/vendedor/${sellerSlug}/producto/${productSlug}`;
  const productUrl = new URL(productHref, getCanonicalSiteOrigin()).toString();
  const sellerHref = `/vendedor/${sellerSlug}`;
  const shareProductHref = `https://wa.me/?text=${encodeURIComponent(
    `Mira este producto en YoComproLocal: ${title} - ${productUrl}`
  )}`;
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
            href={sellerHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/35 px-4 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Ver negocio
          </a>
        </div>
      </section>

      <section className="border-b border-[#dce4d6] bg-[#173a2a] text-white">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-8 sm:px-8 sm:pb-14 lg:px-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f6c55f]">
            Producto local
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/82">
            De {sellerName}, en {zona}. Escribe por WhatsApp para confirmar
            disponibilidad y acordar entrega.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <ProductImageFrame
            alt={title}
            badge={category}
            className="min-h-[390px] rounded-lg border border-[#dbe5d6] shadow-[0_18px_45px_rgba(31,52,41,0.12)] sm:min-h-[560px]"
            imageClassName="p-8 sm:p-12"
            imageUrl={product.image_url}
          />

          <div className="flex flex-col justify-center">
            <section className="rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_14px_36px_rgba(31,52,41,0.08)] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c05635]">
                {category}
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429]">
                {title}
              </h2>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#567164]">
                Precio
              </p>
              <p className="mt-3 text-4xl font-black text-[#c05635]">
                {formatProductPrice(product.price)}
              </p>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#567164]">
                Descripción
              </p>
              <p className="mt-3 whitespace-pre-line text-lg leading-8 text-[#53645a]">
                {description}
              </p>

              <div className="mt-8 grid gap-3">
                {productWhatsAppHref ? (
                  <a
                    href={productWhatsAppHref}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#25d366] px-6 text-base font-black text-[#102318] shadow-sm transition hover:bg-[#39df78]"
                  >
                    Escribir por WhatsApp
                  </a>
                ) : (
                  <p className="rounded-lg bg-[#eef5ec] p-4 text-sm font-semibold leading-6 text-[#53645a] sm:col-span-2">
                    Este negocio todavía no agregó WhatsApp.
                  </p>
                )}
                <a
                  href={sellerHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-6 text-base font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
                >
                  Ver negocio
                </a>
              </div>
            </section>

            <div className="mt-5 grid gap-5">
              <section className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#567164]">
                  Negocio
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

              <section className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#567164]">
                  Cómo comprar
                </p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53645a]">
                  YoComproLocal no cobra ni organiza entregas. Escribe por
                  WhatsApp, confirma disponibilidad y acuerda todo directo con{" "}
                  {sellerName}.
                </p>
              </section>

              <section className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#567164]">
                  Compartir producto
                </p>
                <p className="mt-3 break-all rounded-lg bg-[#eef5ec] p-3 text-sm font-semibold leading-6 text-[#214e34]">
                  {productUrl}
                </p>
                <a
                  href={shareProductHref}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
                >
                  Compartir por WhatsApp
                </a>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
