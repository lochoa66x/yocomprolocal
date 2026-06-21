import type { Metadata } from "next";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createProductRecordSlug,
  formatProductPrice,
  getProductCardDescription,
  PRODUCT_CATEGORIES,
  type ProductRecord,
} from "@/lib/products";
import {
  getProductImageStyle,
  getSellersBySlug,
  getWhatsAppHref,
  type SellerRecord,
} from "@/lib/storefront";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

type ProductWithSeller = {
  product: ProductRecord;
  seller: SellerRecord;
  sellerSlug: string;
};

type Props = {
  searchParams: Promise<{ categoria?: string; q?: string }>;
};

export const metadata: Metadata = {
  title: "Productos locales | YoComproLocal",
  description:
    "Explora productos locales de Cuautitlán Izcalli y contacta directo por WhatsApp.",
};

function isProductCategory(value: string | undefined) {
  return PRODUCT_CATEGORIES.some((category) => category === value);
}

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

function productMatchesSearch(
  productWithSeller: ProductWithSeller,
  searchQuery: string
) {
  const normalizedQuery = normalizeSearchValue(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  const { product, seller } = productWithSeller;
  const searchableText = [
    product.title,
    product.description,
    product.category,
    seller.name,
    seller.zona,
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeSearchValue(searchableText).includes(normalizedQuery);
}

function getProductsHref({
  category,
  searchQuery,
}: {
  category?: string | null;
  searchQuery?: string;
}) {
  const params = new URLSearchParams();

  if (category) {
    params.set("categoria", category);
  }

  if (searchQuery) {
    params.set("q", searchQuery);
  }

  const queryString = params.toString();
  return queryString ? `/productos?${queryString}` : "/productos";
}

async function getPublishedProducts(
  supabase: SupabaseClient,
  selectedCategory: string | null
) {
  let query = supabase
    .from("products")
    .select(
      "id, seller_slug, title, slug, price, category, description, image_url"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  if (selectedCategory) {
    query = query.eq("category", selectedCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase product discovery error:", error);
    return [];
  }

  return (data ?? []) as ProductRecord[];
}

async function getProductDiscovery(selectedCategory: string | null) {
  await connection();

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    return [];
  }

  const [products, sellersBySlug] = await Promise.all([
    getPublishedProducts(supabase, selectedCategory),
    getSellersBySlug(supabase),
  ]);

  return products.flatMap<ProductWithSeller>((product) => {
    const sellerSlug = String(product.seller_slug ?? "").trim();
    const seller = sellersBySlug[sellerSlug];

    if (!sellerSlug || !seller?.name) {
      return [];
    }

    return [
      {
        product,
        seller,
        sellerSlug,
      },
    ];
  });
}

function ProductCard({ product, seller, sellerSlug }: ProductWithSeller) {
  const sellerName = seller.name?.trim() || "Vendedor local";
  const sellerZone = seller.zona?.trim() || "Cuautitlán Izcalli";
  const title = product.title?.trim() || "Producto local";
  const category = product.category?.trim() || "Producto local";
  const description =
    product.description?.trim() || "Producto publicado en YoComproLocal.";
  const cardDescription = getProductCardDescription(description);
  const productSlug = product.slug?.trim() || createProductRecordSlug(title);
  const productHref = `/vendedor/${sellerSlug}/producto/${productSlug}`;
  const sellerHref = `/vendedor/${sellerSlug}`;
  const imageStyle = getProductImageStyle(product.image_url);
  const productWhatsAppHref = seller.whatsapp
    ? getWhatsAppHref(seller.whatsapp, sellerName, title)
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

        <div className="mt-5 rounded-lg bg-[#eef5ec] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
            Vendedor
          </p>
          <a
            href={sellerHref}
            className="relative z-20 mt-2 inline-flex text-base font-black text-[#214e34] transition hover:text-[#2f7c5b]"
          >
            {sellerName}
          </a>
          <p className="mt-1 text-sm font-semibold text-[#6a7a70]">
            {sellerZone}
          </p>
        </div>

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

function CategoryFilters({
  selectedCategory,
  searchQuery,
}: {
  selectedCategory: string | null;
  searchQuery: string;
}) {
  const allActive = !selectedCategory;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filtrar por categoría">
      <a
        href={getProductsHref({ searchQuery })}
        className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-black transition ${
          allActive
            ? "bg-[#214e34] text-white"
            : "border border-[#dbe5d6] bg-white text-[#214e34] hover:bg-[#eef5ec]"
        }`}
      >
        Todos
      </a>
      {PRODUCT_CATEGORIES.map((category) => {
        const active = category === selectedCategory;

        return (
          <a
            key={category}
            href={getProductsHref({ category, searchQuery })}
            className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-black transition ${
              active
                ? "bg-[#214e34] text-white"
                : "border border-[#dbe5d6] bg-white text-[#214e34] hover:bg-[#eef5ec]"
            }`}
          >
            {category}
          </a>
        );
      })}
    </nav>
  );
}

function EmptyProductsState({
  selectedCategory,
  searchQuery,
}: {
  selectedCategory: string | null;
  searchQuery: string;
}) {
  const hasSearch = Boolean(searchQuery);

  return (
    <section className="rounded-lg border border-[#dbe5d6] bg-white p-8 text-center shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
        {selectedCategory ?? "Productos"}
      </p>
      <h2 className="mt-3 text-2xl font-black text-[#1f3429]">
        {hasSearch
          ? "No encontramos productos con esa búsqueda."
          : "Aún no hay productos publicados aquí."}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#53645a]">
        {hasSearch
          ? `Intenta buscar otra palabra o revisa todas las categorías. Buscaste: "${searchQuery}".`
          : "Cuando los vendedores locales publiquen productos, aparecerán en este catálogo para que los compradores puedan contactar directo por WhatsApp."}
      </p>
      <a
        href={hasSearch ? getProductsHref({ category: selectedCategory }) : "/registro"}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
      >
        {hasSearch ? "Limpiar búsqueda" : "Quiero vender"}
      </a>
    </section>
  );
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedCategory = isProductCategory(params.categoria)
    ? params.categoria ?? null
    : null;
  const searchQuery = getSearchQuery(params.q);
  const products = (await getProductDiscovery(selectedCategory)).filter(
    (productWithSeller) => productMatchesSearch(productWithSeller, searchQuery)
  );
  const resultLabel = searchQuery
    ? `Resultados para "${searchQuery}"`
    : "Productos publicados";

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
                href="/registro"
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
              Productos locales de Cuautitlán Izcalli
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/84">
              Explora productos publicados por negocios cercanos y habla
              directo con quien vende por WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce4d6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-0 divide-y divide-[#dce4d6] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          <div className="py-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Resultados
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {products.length}
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
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Categoría
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {selectedCategory ?? "Todos"}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
                Catálogo
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
                {resultLabel}
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53645a]">
                Busca por producto, vendedor, zona o categoría. Abre la página
                del producto o contacta al vendedor sin carrito ni checkout.
              </p>
            </div>
            <CategoryFilters
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
            />
          </div>

          <form
            action="/productos"
            className="mt-8 grid gap-3 rounded-lg border border-[#dbe5d6] bg-white p-4 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:grid-cols-[1fr_auto_auto]"
          >
            {selectedCategory && (
              <input
                type="hidden"
                name="categoria"
                value={selectedCategory}
              />
            )}
            <label className="sr-only" htmlFor="product-search">
              Buscar productos
            </label>
            <input
              id="product-search"
              name="q"
              type="search"
              defaultValue={searchQuery}
              placeholder="Buscar tacos, salsa, María, Centro Urbano..."
              className="min-h-12 rounded-full border border-[#dbe5d6] bg-[#fbfbf7] px-5 text-base font-semibold text-[#1f3429] outline-none transition placeholder:text-[#8a988f] focus:border-[#2f7c5b] focus:bg-white"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#214e34] px-6 text-sm font-black text-white transition hover:bg-[#2f7c5b]"
            >
              Buscar
            </button>
            {(searchQuery || selectedCategory) && (
              <a
                href="/productos"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-6 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Limpiar
              </a>
            )}
          </form>

          <div className="mt-10">
            {products.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((productWithSeller) => (
                  <ProductCard
                    key={productWithSeller.product.id}
                    {...productWithSeller}
                  />
                ))}
              </div>
            ) : (
              <EmptyProductsState
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
