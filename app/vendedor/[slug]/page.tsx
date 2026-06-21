import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createProductRecordSlug,
  formatProductPrice,
  type ProductRecord,
} from "@/lib/products";
import {
  getInitials,
  getProductImageStyle,
  getSellerBySlug,
  getWhatsAppHref,
  type SellerRecord,
} from "@/lib/storefront";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

type SellerProfile = {
  seller: SellerRecord;
  products: ProductRecord[];
};

type Props = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Vendedor local | YoComproLocal",
  description:
    "Perfil público de vendedor local en YoComproLocal para contactar directo por WhatsApp.",
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

function getCardDescription(description: string) {
  const maxLength = 150;
  const trimmed = description.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const shortened = trimmed.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${shortened || trimmed.slice(0, maxLength).trimEnd()}...`;
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
  const cardDescription = getCardDescription(description);
  const productSlug = product.slug?.trim() || createProductRecordSlug(title);
  const productHref = `/vendedor/${sellerSlug}/producto/${productSlug}`;
  const imageStyle = getProductImageStyle(product.image_url);
  const productWhatsAppHref = sellerWhatsapp
    ? getWhatsAppHref(sellerWhatsapp, sellerName, title)
    : null;

  return (
    <article className="relative overflow-hidden rounded-lg border border-[#dbe5d6] bg-white shadow-[0_10px_28px_rgba(31,52,41,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(31,52,41,0.12)]">
      <a
        href={productHref}
        className="absolute inset-0 z-10"
        aria-label={`Ver producto ${title}`}
      />
      <div
        className="relative flex aspect-[4/3] items-end bg-[linear-gradient(135deg,#f6c55f_0%,#e37852_48%,#2f7c5b_100%)] bg-cover bg-center p-4"
        style={imageStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#173a2a]/60 via-transparent to-transparent" />
        <span className="relative rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#214e34]">
          {category}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-black leading-tight text-[#1f3429]">
            {title}
          </h3>
          <p className="shrink-0 text-lg font-black text-[#c05635]">
            {formatProductPrice(product.price)}
          </p>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#53645a]">
          {cardDescription}
        </p>

        <div className="relative z-20 mt-5 grid gap-3">
          <a
            href={productHref}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
          >
            Ver producto
          </a>

          {productWhatsAppHref ? (
            <a
              href={productWhatsAppHref}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
            >
              Preguntar por WhatsApp
            </a>
          ) : (
            <p className="rounded-lg bg-[#eef5ec] p-3 text-sm font-semibold leading-6 text-[#53645a]">
              Contacto pendiente.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyProductsState() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-lg border border-[#dbe5d6] bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
          Próximo paso
        </p>
        <h3 className="mt-4 text-2xl font-black text-[#1f3429]">
          Carga de productos
        </h3>
        <p className="mt-3 text-base leading-7 text-[#53645a]">
          El vendedor podrá subir una foto, precio y datos básicos para crear
          una página lista para compartir.
        </p>
      </article>

      <article className="rounded-lg border border-[#dbe5d6] bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
          IA
        </p>
        <h3 className="mt-4 text-2xl font-black text-[#1f3429]">
          Texto listo para vender
        </h3>
        <p className="mt-3 text-base leading-7 text-[#53645a]">
          Generaremos descripción, etiquetas y mensaje de WhatsApp para que el
          producto se vea más profesional.
        </p>
      </article>
    </div>
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
    "Vendedor local registrado en YoComproLocal.";
  const whatsappHref = seller.whatsapp
    ? getWhatsAppHref(seller.whatsapp, name)
    : null;

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
        <div className="relative z-10 mx-auto flex min-h-[52svh] w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
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
              href="/registro"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-4 text-sm font-bold text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:px-5"
            >
              Quiero vender
            </a>
          </header>

          <div className="flex flex-1 items-end pb-8 pt-20 sm:pb-12">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#f6c55f]">
                Vendedor local
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-6xl">
                {name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-white/88">
                {zona}
              </p>
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
              Contacto
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              Directo por WhatsApp
            </p>
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

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <aside className="rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
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

            {whatsappHref ? (
              <a
                href={whatsappHref}
                className="mt-6 inline-flex w-full min-h-12 items-center justify-center rounded-full bg-[#25d366] px-5 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
              >
                Contactar por WhatsApp
              </a>
            ) : (
              <p className="mt-6 rounded-lg bg-[#eef5ec] p-4 text-sm font-semibold leading-6 text-[#53645a]">
                Este vendedor todavía no agregó WhatsApp público.
              </p>
            )}
          </aside>

          <div className="space-y-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
                  Productos
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
                  Productos de este vendedor
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53645a]">
                  Este espacio será la vitrina pública donde cada producto tenga
                  foto, precio, descripción con IA y botón para contactar
                  directo.
                </p>
              </div>
              <a
                href={`/producto/nuevo?seller=${slug}`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
              >
                Agregar producto
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
              <EmptyProductsState />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
