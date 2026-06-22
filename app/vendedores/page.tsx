import type { Metadata } from "next";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getInitials,
  getSellerRecordSlug,
  getSellersBySlug,
  getWhatsAppHref,
  type SellerRecord,
} from "@/lib/storefront";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

type SellerDirectoryRecord = {
  seller: SellerRecord;
  sellerSlug: string;
  productCount: number;
};

type ProductSellerSlugRecord = {
  seller_slug: string | null;
};

export const metadata: Metadata = {
  title: "Negocios locales | YoComproLocal",
  description:
    "Explora negocios locales de Cuautitlán Izcalli y escribe directo por WhatsApp.",
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getSearchQuery(value: string | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed.slice(0, 80);
}

function sellerMatchesSearch(
  sellerDirectoryRecord: SellerDirectoryRecord,
  searchQuery: string
) {
  const normalizedQuery = normalizeSearchValue(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  const { seller } = sellerDirectoryRecord;
  const searchableText = [seller.name, seller.zona, seller.description]
    .filter(Boolean)
    .join(" ");

  return normalizeSearchValue(searchableText).includes(normalizedQuery);
}

async function getPublishedProductCounts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("products")
    .select("seller_slug")
    .eq("status", "published")
    .limit(1000);

  if (error) {
    console.error("Supabase seller directory product count error:", error);
    return {};
  }

  return ((data ?? []) as ProductSellerSlugRecord[]).reduce<
    Record<string, number>
  >((counts, product) => {
    const sellerSlug = product.seller_slug?.trim();

    if (sellerSlug) {
      counts[sellerSlug] = (counts[sellerSlug] ?? 0) + 1;
    }

    return counts;
  }, {});
}

async function getSellerDirectory() {
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
    .flatMap<SellerDirectoryRecord>(([sellerSlug, seller]) => {
      const name = seller.name?.trim();
      const usableSlug = sellerSlug || getSellerRecordSlug(seller);

      if (!name || !usableSlug) {
        return [];
      }

      return [
        {
          seller,
          sellerSlug: usableSlug,
          productCount: productCountsBySellerSlug[usableSlug] ?? 0,
        },
      ];
    })
    .sort((firstSeller, secondSeller) => {
      const productCountDifference =
        secondSeller.productCount - firstSeller.productCount;

      if (productCountDifference !== 0) {
        return productCountDifference;
      }

      const firstName = firstSeller.seller.name?.trim() ?? "";
      const secondName = secondSeller.seller.name?.trim() ?? "";

      return firstName.localeCompare(secondName, "es");
    });
}

function getProductCountLabel(productCount: number) {
  if (productCount === 1) {
    return "1 producto publicado";
  }

  return `${productCount} productos publicados`;
}

function SellerCard({
  seller,
  sellerSlug,
  productCount,
}: SellerDirectoryRecord) {
  const sellerName = seller.name?.trim() || "Negocio local";
  const sellerZone = seller.zona?.trim() || "Cuautitlán Izcalli";
  const description =
    seller.description?.trim() ||
    "Negocio local listo para atender por WhatsApp.";
  const sellerHref = `/vendedor/${sellerSlug}`;
  const whatsappHref = seller.whatsapp
    ? getWhatsAppHref(seller.whatsapp, sellerName)
    : null;

  return (
    <article className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(31,52,41,0.12)]">
      <div className="flex items-start gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e8] text-xl font-black text-[#214e34]">
          {getInitials(sellerName)}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c05635]">
            Negocio local
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#1f3429]">
            {sellerName}
          </h2>
          <p className="mt-1 text-sm font-bold text-[#6a7a70]">{sellerZone}</p>
        </div>
      </div>

      <p className="mt-5 text-base leading-7 text-[#53645a]">{description}</p>

      <div className="mt-5 grid gap-3 rounded-lg bg-[#eef5ec] p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
            Productos
          </p>
          <p className="mt-1 text-base font-black text-[#214e34]">
            {getProductCountLabel(productCount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
            Zona
          </p>
          <p className="mt-1 text-base font-black text-[#214e34]">
            {sellerZone}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href={sellerHref}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#214e34] px-5 text-sm font-black text-white transition hover:bg-[#2f7c5b]"
        >
          Ver negocio
        </a>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
          >
            Escribir por WhatsApp
          </a>
        ) : (
          <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#53645a]">
            Contacto pendiente
          </span>
        )}
      </div>
    </article>
  );
}

function EmptySellersState({ searchQuery }: { searchQuery: string }) {
  const hasSearch = Boolean(searchQuery);

  return (
    <section className="rounded-lg border border-[#dbe5d6] bg-white p-8 text-center shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
        Negocios
      </p>
      <h2 className="mt-3 text-2xl font-black text-[#1f3429]">
        {hasSearch
          ? "No encontramos negocios con esa búsqueda."
          : "Aún no hay negocios publicados."}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#53645a]">
        {hasSearch
          ? `Intenta buscar otra palabra o revisa todos los negocios. Buscaste: "${searchQuery}".`
          : "Cuando los negocios locales creen su página, aparecerán aquí para que puedas descubrirlos."}
      </p>
      <a
        href={hasSearch ? "/vendedores" : "/vender"}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
      >
        {hasSearch ? "Limpiar búsqueda" : "Quiero vender"}
      </a>
    </section>
  );
}

export default async function SellersPage({ searchParams }: Props) {
  const params = await searchParams;
  const searchQuery = getSearchQuery(params.q);
  const allSellers = await getSellerDirectory();
  const sellers = allSellers.filter((sellerDirectoryRecord) =>
    sellerMatchesSearch(sellerDirectoryRecord, searchQuery)
  );
  const resultLabel = searchQuery
    ? `Resultados para "${searchQuery}"`
    : "Negocios locales";
  const productTotal = allSellers.reduce(
    (total, seller) => total + seller.productCount,
    0
  );

  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <section className="bg-[#173a2a] text-white">
        <div className="mx-auto flex max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
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
            <div className="flex shrink-0 items-center gap-2">
              <a
                href="/productos"
                className="hidden min-h-11 items-center justify-center rounded-full border border-white/35 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/18 sm:inline-flex"
              >
                Ver productos
              </a>
              <a
                href="/vender"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-4 text-sm font-bold text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:px-5"
              >
                Quiero vender
              </a>
            </div>
          </header>

          <div className="pb-12 pt-20 sm:pb-16">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f6c55f]">
              Compra local
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
              Negocios locales de Cuautitlán Izcalli
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/84">
              Encuentra negocios cercanos, revisa qué venden y escribe por
              WhatsApp, sin carrito ni pagos dentro de YoComproLocal.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce4d6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-0 divide-y divide-[#dce4d6] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          <div className="py-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Negocios
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {sellers.length}
            </p>
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Productos publicados
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {productTotal}
            </p>
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Búsqueda
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {searchQuery || "Todos"}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
                Directorio
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
                {resultLabel}
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53645a]">
                Busca por nombre del negocio, zona o lo que ofrece. Cada
                negocio tiene una página lista para compartir.
              </p>
            </div>
            <a
              href="/productos"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-6 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
            >
              Ver productos
            </a>
          </div>

          <form
            action="/vendedores"
            className="mt-8 grid gap-3 rounded-lg border border-[#dbe5d6] bg-white p-4 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:grid-cols-[1fr_auto_auto]"
          >
            <label className="sr-only" htmlFor="seller-search">
              Buscar negocios
            </label>
            <input
              id="seller-search"
              name="q"
              type="search"
              defaultValue={searchQuery}
              placeholder="Buscar María, abarrotes, Centro, postres..."
              className="min-h-12 rounded-full border border-[#dbe5d6] bg-[#fbfbf7] px-5 text-base font-semibold text-[#1f3429] outline-none transition placeholder:text-[#8a988f] focus:border-[#2f7c5b] focus:bg-white"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#214e34] px-6 text-sm font-black text-white transition hover:bg-[#2f7c5b]"
            >
              Buscar
            </button>
            {searchQuery && (
              <a
                href="/vendedores"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-6 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Limpiar
              </a>
            )}
          </form>

          <div className="mt-10">
            {sellers.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {sellers.map((sellerDirectoryRecord) => (
                  <SellerCard
                    key={sellerDirectoryRecord.sellerSlug}
                    {...sellerDirectoryRecord}
                  />
                ))}
              </div>
            ) : (
              <EmptySellersState searchQuery={searchQuery} />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
