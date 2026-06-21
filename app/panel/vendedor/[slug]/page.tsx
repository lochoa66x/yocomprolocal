import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import CopyLinkButton from "./CopyLinkButton";
import {
  createProductRecordSlug,
  formatProductPrice,
  getProductCardDescription,
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

type DashboardProductRecord = ProductRecord & {
  status: string | null;
};

type SellerDashboard = {
  seller: SellerRecord;
  products: DashboardProductRecord[];
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ producto?: string }>;
};

export const metadata: Metadata = {
  title: "Panel de vendedor | YoComproLocal",
  description:
    "Panel simple para revisar productos, compartir links y administrar una vitrina local en YoComproLocal.",
};

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://yocomprolocal.com.mx"
  );
}

function getStatusLabel(status: string | null) {
  if (status === "published") {
    return "Publicado";
  }

  if (status === "draft") {
    return "Borrador";
  }

  return "Pendiente";
}

function getStatusClassName(status: string | null) {
  if (status === "published") {
    return "bg-[#e6f1e8] text-[#214e34]";
  }

  return "bg-[#fff1d8] text-[#8a5b14]";
}

async function getSellerProducts(
  supabase: SupabaseClient,
  sellerSlug: string
) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, seller_slug, title, slug, price, category, description, image_url, status"
    )
    .eq("seller_slug", sellerSlug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase dashboard products error:", error);
    return [];
  }

  return (data ?? []) as DashboardProductRecord[];
}

async function getSellerDashboard(
  slug: string
): Promise<SellerDashboard | null> {
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

  const products = await getSellerProducts(supabase, slug);

  return {
    seller,
    products,
  };
}

function DashboardProductCard({
  product,
  sellerName,
  sellerWhatsapp,
  sellerSlug,
}: {
  product: DashboardProductRecord;
  sellerName: string;
  sellerWhatsapp: string | null;
  sellerSlug: string;
}) {
  const title = product.title?.trim() || "Producto local";
  const category = product.category?.trim() || "Producto local";
  const description =
    product.description?.trim() || "Producto publicado en YoComproLocal.";
  const productSlug = product.slug?.trim() || createProductRecordSlug(title);
  const productHref = `/vendedor/${sellerSlug}/producto/${productSlug}`;
  const imageStyle = getProductImageStyle(product.image_url);
  const status = product.status?.trim() || "draft";
  const productWhatsAppHref = sellerWhatsapp
    ? getWhatsAppHref(sellerWhatsapp, sellerName, title)
    : null;

  return (
    <article className="overflow-hidden rounded-lg border border-[#dbe5d6] bg-white shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div
          className="relative flex min-h-52 items-end bg-[linear-gradient(135deg,#f6c55f_0%,#e37852_48%,#2f7c5b_100%)] bg-cover bg-center p-4 md:min-h-full"
          style={imageStyle}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#173a2a]/65 via-transparent to-transparent" />
          <span className="relative rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#214e34]">
            {category}
          </span>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-black leading-tight text-[#1f3429]">
                  {title}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${getStatusClassName(
                    status
                  )}`}
                >
                  {getStatusLabel(status)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#53645a]">
                {getProductCardDescription(description)}
              </p>
            </div>
            <p className="shrink-0 text-xl font-black text-[#c05635]">
              {formatProductPrice(product.price)}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {status === "published" ? (
              <a
                href={productHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Ver producto
              </a>
            ) : (
              <p className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#eef5ec] px-5 text-center text-sm font-black text-[#53645a]">
                Sin página pública
              </p>
            )}

            {productWhatsAppHref ? (
              <a
                href={productWhatsAppHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
              >
                WhatsApp
              </a>
            ) : (
              <p className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#eef5ec] px-5 text-center text-sm font-black text-[#53645a]">
                WhatsApp pendiente
              </p>
            )}

            <a
              href={`/producto/nuevo?seller=${sellerSlug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] transition hover:bg-[#ffd77a]"
            >
              Agregar otro
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyProductsState({ sellerSlug }: { sellerSlug: string }) {
  return (
    <section className="rounded-lg border border-dashed border-[#b9cbb4] bg-white p-8 text-center shadow-[0_10px_28px_rgba(31,52,41,0.05)]">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
        Primer producto
      </p>
      <h2 className="mt-4 text-3xl font-black leading-tight text-[#1f3429]">
        Tu vitrina todavía está vacía.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#53645a]">
        Agrega una foto, precio y descripción. YoComproLocal creará una página
        lista para compartir por WhatsApp.
      </p>
      <a
        href={`/producto/nuevo?seller=${sellerSlug}`}
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#f6c55f] px-6 text-base font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
      >
        Agregar mi primer producto
      </a>
    </section>
  );
}

export default async function SellerDashboardPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const dashboard = await getSellerDashboard(slug);

  if (!dashboard) {
    notFound();
  }

  const { seller, products } = dashboard;
  const sellerName = seller.name?.trim();

  if (!sellerName) {
    notFound();
  }

  const zona = seller.zona?.trim() || "Cuautitlán Izcalli";
  const description =
    seller.description?.trim() ||
    "Vendedor local registrado en YoComproLocal.";
  const publicSellerHref = `/vendedor/${slug}`;
  const publicSellerUrl = `${getSiteUrl()}${publicSellerHref}`;
  const addProductHref = `/producto/nuevo?seller=${slug}`;
  const whatsappStatus = seller.whatsapp?.trim()
    ? "WhatsApp listo"
    : "Falta WhatsApp";
  const showProductCreated = query.producto === "creado";

  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <section className="border-b border-[#dce4d6] bg-[#173a2a] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
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
            href={publicSellerHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/35 px-4 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Ver página pública
          </a>
        </div>
      </section>

      <section className="bg-[#173a2a] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-9 pt-8 sm:px-8 sm:pb-12 lg:px-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f6c55f]">
            Panel de vendedor
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
                {sellerName}
              </h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-white/82">
                Revisa tus productos, comparte tu página y agrega nuevos
                productos cuando quieras.
              </p>
            </div>
            <a
              href={addProductHref}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#f6c55f] px-6 text-base font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
            >
              Agregar producto
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce4d6] bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#dce4d6] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          <div className="py-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Zona
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">{zona}</p>
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Productos
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {products.length}
            </p>
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Contacto
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {whatsappStatus}
            </p>
          </div>
        </div>
      </section>

      {showProductCreated && (
        <section className="border-b border-[#dce4d6] bg-[#eef5ec]">
          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
            <div className="rounded-lg border border-[#b9d8b8] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.05)]">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f7c5b]">
                Producto publicado
              </p>
              <p className="mt-2 text-lg font-bold leading-7 text-[#214e34]">
                Producto publicado. Ya puedes compartirlo con tus clientes.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-5 sm:px-8 lg:grid-cols-[360px_1fr] lg:px-10 xl:grid-cols-[400px_1fr]">
          <aside className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:p-6 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e8] text-xl font-black text-[#214e34]">
                {getInitials(sellerName)}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-[#1f3429]">
                  {sellerName}
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#6a7a70]">
                  {zona}
                </p>
              </div>
            </div>

            <p className="mt-6 text-base leading-7 text-[#53645a]">
              {description}
            </p>

            <div className="mt-6 rounded-lg bg-[#eef5ec] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Comparte tu página
              </p>
              <p className="mt-3 break-all rounded-lg bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#214e34]">
                {publicSellerUrl}
              </p>
              <div className="mt-4 grid gap-3">
                <CopyLinkButton value={publicSellerUrl} />
                <a
                  href={publicSellerHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#f7fbf4]"
                >
                  Ver mi página pública
                </a>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
                  Productos
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
                  Tu vitrina local
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53645a]">
                  Cada producto puede vivir en su propia página pública y
                  conectar directo por WhatsApp.
                </p>
              </div>
              <a
                href={addProductHref}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
              >
                Agregar producto
              </a>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-4">
                {products.map((product) => (
                  <DashboardProductCard
                    key={product.id}
                    product={product}
                    sellerName={sellerName}
                    sellerWhatsapp={seller.whatsapp}
                    sellerSlug={slug}
                  />
                ))}
              </div>
            ) : (
              <EmptyProductsState sellerSlug={slug} />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
