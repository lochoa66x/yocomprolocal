import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createProductRecordSlug,
  formatProductPrice,
  getProductCardDescription,
  type ProductRecord,
} from "@/lib/products";
import { ProductImageFrame } from "@/components/product-image-frame";
import {
  getInitials,
  getSellerBySlug,
  getWhatsAppHref,
  type SellerRecord,
} from "@/lib/storefront";
import { getCanonicalSiteOrigin } from "@/lib/site-url";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

type SellerProfile = {
  seller: SellerRecord;
  products: ProductRecord[];
};

type Props = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Negocio local | YoComproLocal",
  description:
    "Página de negocio local en YoComproLocal para escribir directo por WhatsApp.",
};

async function getPublishedProducts(
  supabase: SupabaseClient,
  sellerSlug: string
) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, seller_slug, title, slug, price, category, description, image_url"
    )
    .eq("seller_slug", sellerSlug)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase products error:", error);
    return [];
  }

  return (data ?? []) as ProductRecord[];
}

async function getSellerProfileBySlug(
  slug: string
): Promise<SellerProfile | null> {
  await connection();

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    return null;
  }

  const seller = await getSellerBySlug(supabase, slug);

  if (!seller) {
    return null;
  }

  const products = await getPublishedProducts(supabase, slug);

  return {
    seller,
    products,
  };
}

function ProductCard({
  product,
  sellerName,
  sellerWhatsapp,
  sellerSlug,
}: {
  product: ProductRecord;
  sellerName: string;
  sellerWhatsapp: string | null;
  sellerSlug: string;
}) {
  const title = product.title?.trim() || "Producto local";
  const category = product.category?.trim() || "Producto local";
  const description =
    product.description?.trim() || "Producto publicado en YoComproLocal.";
  const cardDescription = getProductCardDescription(description);
  const productSlug = product.slug?.trim() || createProductRecordSlug(title);
  const productHref = `/vendedor/${sellerSlug}/producto/${productSlug}`;
  const productWhatsAppHref = sellerWhatsapp
    ? getWhatsAppHref(sellerWhatsapp, sellerName, title)
    : null;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-[#dbe5d6] bg-white shadow-[0_10px_28px_rgba(31,52,41,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(31,52,41,0.12)]">
      <a
        href={productHref}
        className="absolute inset-0 z-10"
        aria-label={`Abrir página del producto ${title}`}
      />
      <ProductImageFrame
        alt={title}
        badge={category}
        imageUrl={product.image_url}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 break-words text-xl font-black leading-tight text-[#1f3429] transition group-hover:text-[#2f7c5b]">
            {title}
          </h3>
          <p className="shrink-0 text-lg font-black text-[#c05635]">
            {formatProductPrice(product.price)}
          </p>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#53645a]">
          {cardDescription}
        </p>
        <p className="mt-4 rounded-lg bg-[#eef5ec] px-3 py-3 text-sm font-semibold leading-6 text-[#214e34]">
          Abre la página del producto para ver detalles y compartir el link.
        </p>

        <div className="relative z-20 mt-5 grid gap-3">
          <a
            href={productHref}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#214e34] px-5 text-center text-sm font-black leading-5 text-white transition hover:bg-[#2f7c5b]"
          >
            Ver página del producto
          </a>

          {productWhatsAppHref ? (
            <a
              href={productWhatsAppHref}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-center text-sm font-black leading-5 text-[#102318] transition hover:bg-[#39df78]"
            >
              Preguntar por WhatsApp
            </a>
          ) : (
            <p className="rounded-lg bg-[#eef5ec] p-3 text-sm font-semibold leading-6 text-[#53645a]">
              WhatsApp pendiente.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyProductsState({
  sellerName,
  whatsappHref,
}: {
  sellerName: string;
  whatsappHref: string | null;
}) {
  return (
    <section className="rounded-lg border border-[#dbe5d6] bg-white p-7 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
        Productos en camino
      </p>
      <h3 className="mt-3 text-3xl font-black leading-tight text-[#1f3429]">
        {sellerName} pronto tendrá productos aquí.
      </h3>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#53645a]">
        Este negocio ya tiene contacto directo. Cuando publique productos,
        verás fotos, precios y páginas listas para compartir por WhatsApp.
      </p>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#25d366] px-6 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
        >
          Escribir por WhatsApp
        </a>
      ) : (
        <p className="mt-6 rounded-lg bg-[#eef5ec] p-4 text-sm font-semibold leading-6 text-[#53645a]">
          Este negocio todavía no agregó WhatsApp.
        </p>
      )}
    </section>
  );
}

export default async function SellerProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getSellerProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const { seller, products } = profile;
  const sellerName = seller.name;

  if (!sellerName) {
    notFound();
  }

  const name = sellerName.trim();
  const zona = seller.zona?.trim() || "Cuautitlán Izcalli";
  const description =
    seller.description?.trim() ||
    "Negocio local registrado en YoComproLocal.";
  const whatsappHref = seller.whatsapp
    ? getWhatsAppHref(seller.whatsapp, name)
    : null;
  const storeHref = `/vendedor/${slug}`;
  const storeUrl = new URL(storeHref, getCanonicalSiteOrigin()).toString();
  const shareStoreHref = `https://wa.me/?text=${encodeURIComponent(
    `Mira este negocio local de ${name} en YoComproLocal: ${storeUrl}`
  )}`;

  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <section className="relative isolate overflow-hidden bg-[#173a2a] text-white">
        <Image
          src="/images/yocomprolocal-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-[#173a2a]/76" />
        <div className="relative z-10 mx-auto flex min-h-[360px] w-full max-w-7xl flex-col px-5 py-5 sm:min-h-[410px] sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-3">
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
              href="/vender"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-4 text-sm font-bold text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:px-5"
            >
              Quiero vender
            </a>
          </header>

          <div className="flex flex-1 items-end pb-8 pt-12 sm:pb-10 sm:pt-16">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#f6c55f]">
                Negocio local
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-6xl">
                {name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-white/88">
                Compra directo con este negocio de {zona}. YoComproLocal te
                ayuda a descubrirlo; el pedido se acuerda directo por WhatsApp.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#25d366] px-6 text-center text-base font-black text-[#102318] transition hover:bg-[#39df78]"
                  >
                    Escribir por WhatsApp
                  </a>
                )}
                <a
                  href="#productos"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 text-center text-base font-black text-white transition hover:bg-white/18"
                >
                  Ver productos
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce4d6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-0 divide-y divide-[#dce4d6] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          <div className="py-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Zona
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">{zona}</p>
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Compra
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                className="mt-2 inline-flex text-2xl font-black text-[#214e34] underline decoration-[#25d366] decoration-2 underline-offset-4"
              >
                Pregunta por WhatsApp
              </a>
            ) : (
              <p className="mt-2 text-2xl font-black text-[#214e34]">
                Contacto pendiente
              </p>
            )}
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Productos
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {products.length}
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-5 sm:px-8 lg:grid-cols-[360px_1fr] lg:px-10 xl:grid-cols-[400px_1fr]">
          <aside className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:p-6 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e8] text-xl font-black text-[#214e34]">
                {getInitials(name)}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-[#1f3429]">{name}</h2>
                <p className="mt-1 text-sm font-semibold text-[#6a7a70]">
                  {zona}
                </p>
              </div>
            </div>

            <p className="mt-6 text-base leading-7 text-[#53645a]">
              {description}
            </p>

            <div className="mt-6 rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Cómo comprar
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645a]">
                Revisa un producto, abre su página y escribe por WhatsApp. El
                pago, entrega y disponibilidad se acuerdan directo con el
                negocio.
              </p>
            </div>

            {whatsappHref ? (
              <a
                href={whatsappHref}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-center text-base font-black text-[#102318] transition hover:bg-[#39df78]"
              >
                Escribir por WhatsApp
              </a>
            ) : (
              <p className="mt-6 rounded-lg bg-[#eef5ec] p-4 text-sm font-semibold leading-6 text-[#53645a]">
                Este negocio todavía no agregó WhatsApp.
              </p>
            )}

            <div className="mt-4 rounded-lg border border-[#dbe5d6] bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Compartir negocio
              </p>
              <p className="mt-2 break-all rounded-lg bg-[#eef5ec] p-3 text-sm font-semibold leading-6 text-[#214e34]">
                {storeUrl}
              </p>
              <a
                href={shareStoreHref}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-center text-sm font-black leading-5 text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Compartir por WhatsApp
              </a>
            </div>

            <a
              href="/panel"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-center text-sm font-black leading-5 text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
            >
              Entrar como vendedor
            </a>
          </aside>

          <div id="productos" className="scroll-mt-8 space-y-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
                  Escaparate
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-4xl">
                  Productos de este negocio
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53645a]">
                  Toca un producto para abrir su página con foto, precio,
                  descripción y contacto directo.
                </p>
              </div>
              <a
                href="/panel"
                className="hidden min-h-11 shrink-0 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec] sm:inline-flex"
              >
                Entrar como vendedor
              </a>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    sellerName={name}
                    sellerWhatsapp={seller.whatsapp}
                    sellerSlug={slug}
                  />
                ))}
              </div>
            ) : (
              <EmptyProductsState
                sellerName={name}
                whatsappHref={whatsappHref}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
