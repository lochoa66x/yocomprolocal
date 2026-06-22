import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductImageFrame } from "@/components/product-image-frame";
import {
  formatProductPrice,
  getProductCardDescription,
} from "@/lib/products";
import {
  endAdminSession,
  hasAdminSession,
  isAdminAccessConfigured,
  requireAdminAccess,
  startAdminSession,
} from "@/lib/admin-auth";
import { getInitials } from "@/lib/storefront";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | YoComproLocal",
  description:
    "Panel interno para revisar negocios y moderar productos de YoComproLocal.",
};

type Props = {
  searchParams: Promise<{
    error?: string;
    next?: string;
    updated?: string;
  }>;
};

type AdminSeller = {
  id: string | null;
  slug: string | null;
  user_id: string | null;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  zona: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AdminProduct = {
  id: string;
  seller_id: string | null;
  seller_slug: string | null;
  title: string | null;
  slug: string | null;
  price: number | string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AdminModerationData = {
  products: AdminProduct[];
  sellers: AdminSeller[];
};

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getSafeNextPath(nextPath: string) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/admin";
  }

  return nextPath;
}

function getAdminHref({
  error,
  nextPath,
  updated,
}: {
  error?: string;
  nextPath?: string;
  updated?: string;
}) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  if (nextPath) {
    params.set("next", getSafeNextPath(nextPath));
  }

  if (updated) {
    params.set("updated", updated);
  }

  const queryString = params.toString();
  return `/admin${queryString ? `?${queryString}` : ""}`;
}

function getDateLabel(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getProductPublicHref(product: AdminProduct) {
  const sellerSlug = product.seller_slug?.trim();
  const productSlug = product.slug?.trim();

  if (!sellerSlug || !productSlug) {
    return null;
  }

  return `/vendedor/${sellerSlug}/producto/${productSlug}`;
}

function getSellerPublicHref(sellerSlug: string | null) {
  const slug = sellerSlug?.trim();

  return slug ? `/vendedor/${slug}` : null;
}

function getErrorMessage(error?: string) {
  if (error === "bad-code") {
    return "Ese código no funcionó. Revisa el código de admin e intenta de nuevo.";
  }

  if (error === "status") {
    return "No pudimos cambiar el estado del producto. Intenta otra vez.";
  }

  if (error === "session") {
    return "Tu sesión de admin venció. Entra otra vez.";
  }

  if (error) {
    return "Algo salió mal. Intenta de nuevo.";
  }

  return null;
}

function getUpdatedMessage(updated?: string) {
  if (updated === "published") {
    return "Producto visible para clientes.";
  }

  if (updated === "draft") {
    return "Producto oculto para clientes.";
  }

  return null;
}

async function getAdminModerationData(): Promise<AdminModerationData> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      products: [],
      sellers: [],
    };
  }

  const [sellersResult, productsResult] = await Promise.all([
    supabase
      .from("sellers")
      .select(
        "id, slug, user_id, name, email, whatsapp, zona, description, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("products")
      .select(
        "id, seller_id, seller_slug, title, slug, price, category, description, image_url, status, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  if (sellersResult.error) {
    console.error("Supabase admin sellers error:", sellersResult.error);
  }

  if (productsResult.error) {
    console.error("Supabase admin products error:", productsResult.error);
  }

  return {
    sellers: ((sellersResult.data ?? []) as AdminSeller[]) ?? [],
    products: ((productsResult.data ?? []) as AdminProduct[]) ?? [],
  };
}

async function logInAdmin(formData: FormData) {
  "use server";

  const code = getFormValue(formData, "code");
  const nextPath = getSafeNextPath(getFormValue(formData, "next"));
  const loggedIn = await startAdminSession(code);

  if (!loggedIn) {
    redirect(getAdminHref({ error: "bad-code", nextPath }));
  }

  redirect(nextPath);
}

async function logOutAdmin() {
  "use server";

  await endAdminSession();
  redirect("/admin");
}

async function updateProductStatus(formData: FormData) {
  "use server";

  const productId = getFormValue(formData, "productId");
  const nextStatus = getFormValue(formData, "nextStatus");
  const sellerSlug = getFormValue(formData, "sellerSlug");
  const productSlug = getFormValue(formData, "productSlug");

  if (!productId || !["draft", "published"].includes(nextStatus)) {
    redirect(getAdminHref({ error: "status" }));
  }

  const { supabase } = await requireAdminAccess("/admin");

  const { error } = await supabase
    .from("products")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    console.error("Supabase admin product status error:", error);
    redirect(getAdminHref({ error: "status" }));
  }

  revalidatePath("/");
  revalidatePath("/productos");

  if (sellerSlug) {
    revalidatePath(`/vendedor/${sellerSlug}`);
  }

  if (sellerSlug && productSlug) {
    revalidatePath(`/vendedor/${sellerSlug}/producto/${productSlug}`);
  }

  redirect(getAdminHref({ updated: nextStatus }));
}

function AdminShell({
  children,
  showLogout = false,
}: {
  children: React.ReactNode;
  showLogout?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <header className="border-b border-[#dce4d6] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <a
            href="/"
            className="flex min-w-0 items-center gap-3 font-semibold"
            aria-label="YoComproLocal inicio"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e8] text-sm font-black text-[#214e34] shadow-sm">
              YCL
            </span>
            <span className="hidden text-lg tracking-wide min-[420px]:inline">
              YoComproLocal
            </span>
          </a>

          {showLogout && (
            <form action={logOutAdmin}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-4 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Salir de admin
              </button>
            </form>
          )}
        </div>
      </header>

      {children}
    </main>
  );
}

function AdminSetupMissing() {
  return (
    <AdminShell>
      <section className="mx-auto flex min-h-[calc(100vh-82px)] max-w-xl items-center px-5 py-12 sm:px-8">
        <div className="rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_18px_45px_rgba(31,52,41,0.10)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
            Configuración pendiente
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-[#1f3429]">
            Falta crear el código de admin.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#53645a]">
            Agrega la variable <code>ADMIN_ACCESS_CODE</code> en Vercel para
            activar esta pantalla. Usa un código largo y difícil de adivinar.
          </p>
        </div>
      </section>
    </AdminShell>
  );
}

function AdminLogin({
  errorMessage,
  nextPath,
}: {
  errorMessage: string | null;
  nextPath: string;
}) {
  return (
    <AdminShell>
      <section className="mx-auto flex min-h-[calc(100vh-82px)] max-w-xl items-center px-5 py-12 sm:px-8">
        <div className="w-full rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_18px_45px_rgba(31,52,41,0.10)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
            Admin interno
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-[#1f3429]">
            Revisa negocios y productos.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#53645a]">
            Esta pantalla es solo para el equipo. Aquí puedes ver lo publicado
            y ocultar productos si algo no debe estar visible.
          </p>

          {errorMessage && (
            <p className="mt-6 rounded-lg bg-[#fff1ec] p-4 text-sm font-semibold leading-6 text-[#a74429]">
              {errorMessage}
            </p>
          )}

          <form action={logInAdmin} className="mt-7 space-y-5">
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-bold text-[#1f3429]"
              >
                Código de admin
              </label>
              <input
                id="code"
                name="code"
                type="password"
                required
                autoComplete="current-password"
                className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
            >
              Entrar a admin
            </button>
          </form>
        </div>
      </section>
    </AdminShell>
  );
}

function AdminProductCard({
  product,
  seller,
}: {
  product: AdminProduct;
  seller: AdminSeller | null;
}) {
  const title = product.title?.trim() || "Producto sin nombre";
  const category = product.category?.trim() || "Producto";
  const description = getProductCardDescription(
    product.description?.trim() || "Sin descripción."
  );
  const sellerName = seller?.name?.trim() || "Negocio no encontrado";
  const sellerZone = seller?.zona?.trim() || "Zona pendiente";
  const sellerHref = getSellerPublicHref(product.seller_slug);
  const productHref = getProductPublicHref(product);
  const isPublished = product.status === "published";
  const nextStatus = isPublished ? "draft" : "published";
  const statusLabel = isPublished ? "Visible" : "Oculto";

  return (
    <article className="overflow-hidden rounded-lg border border-[#dbe5d6] bg-white shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
      <ProductImageFrame
        alt={title}
        badge={category}
        className="aspect-[16/9]"
        imageClassName="p-4"
        imageUrl={product.image_url}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
                isPublished
                  ? "bg-[#e6f5e8] text-[#214e34]"
                  : "bg-[#fff1d9] text-[#915c11]"
              }`}
            >
              {statusLabel}
            </p>
            <h3 className="mt-3 text-xl font-black leading-tight text-[#1f3429]">
              {title}
            </h3>
          </div>
          <p className="shrink-0 text-lg font-black text-[#c05635]">
            {formatProductPrice(product.price)}
          </p>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#53645a]">{description}</p>

        <div className="mt-5 rounded-lg bg-[#eef5ec] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
            Negocio
          </p>
          <p className="mt-2 text-base font-black text-[#214e34]">
            {sellerName}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#6a7a70]">
            {sellerZone}
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <form action={updateProductStatus}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="nextStatus" value={nextStatus} />
            <input
              type="hidden"
              name="sellerSlug"
              value={product.seller_slug ?? ""}
            />
            <input type="hidden" name="productSlug" value={product.slug ?? ""} />
            <button
              type="submit"
              className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-black transition ${
                isPublished
                  ? "bg-[#fff1ec] text-[#a74429] hover:bg-[#ffe3d8]"
                  : "bg-[#25d366] text-[#102318] hover:bg-[#39df78]"
              }`}
            >
              {isPublished ? "Ocultar producto" : "Publicar producto"}
            </button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2">
            {productHref && (
              <a
                href={productHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Ver producto
              </a>
            )}
            {sellerHref && (
              <a
                href={sellerHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Ver negocio
              </a>
            )}
          </div>

          <p className="text-xs font-semibold leading-5 text-[#6a7a70]">
            Último cambio: {getDateLabel(product.updated_at)}
          </p>
        </div>
      </div>
    </article>
  );
}

function SellerReviewCard({ seller }: { seller: AdminSeller }) {
  const name = seller.name?.trim() || "Negocio sin nombre";
  const zone = seller.zona?.trim() || "Zona pendiente";
  const description = seller.description?.trim() || "Sin descripción.";
  const sellerHref = getSellerPublicHref(seller.slug);

  return (
    <article className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e8] text-base font-black text-[#214e34]">
          {getInitials(name)}
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-black leading-tight text-[#1f3429]">
            {name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-[#6a7a70]">{zone}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#53645a]">{description}</p>

      <div className="mt-5 grid gap-3 rounded-lg bg-[#fbfbf7] p-4 text-sm font-semibold leading-6 text-[#53645a]">
        <p>
          <span className="font-black text-[#214e34]">Correo:</span>{" "}
          {seller.email || "Pendiente"}
        </p>
        <p>
          <span className="font-black text-[#214e34]">WhatsApp:</span>{" "}
          {seller.whatsapp || "Pendiente"}
        </p>
        <p>
          <span className="font-black text-[#214e34]">Panel:</span>{" "}
          {seller.user_id ? "Conectado" : "Sin conectar"}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {sellerHref && (
          <a
            href={sellerHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#214e34] px-4 text-sm font-black text-white transition hover:bg-[#2f7c5b]"
          >
            Ver página
          </a>
        )}
        {seller.email && (
          <a
            href={`mailto:${seller.email}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-4 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
          >
            Escribir correo
          </a>
        )}
      </div>
    </article>
  );
}

function AdminDashboard({
  data,
  updatedMessage,
}: {
  data: AdminModerationData;
  updatedMessage: string | null;
}) {
  const sellersBySlug = data.sellers.reduce<Record<string, AdminSeller>>(
    (lookup, seller) => {
      const slug = seller.slug?.trim();

      if (slug) {
        lookup[slug] = seller;
      }

      return lookup;
    },
    {}
  );
  const visibleProducts = data.products.filter(
    (product) => product.status === "published"
  );
  const hiddenProducts = data.products.filter(
    (product) => product.status !== "published"
  );

  return (
    <AdminShell showLogout>
      <section className="bg-[#173a2a] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f6c55f]">
            Admin interno
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
            Moderación de YoComproLocal
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/82">
            Revisa negocios, confirma qué productos están visibles y oculta lo
            que necesite corrección.
          </p>
        </div>
      </section>

      <section className="border-b border-[#dce4d6] bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#dce4d6] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          <div className="py-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Negocios
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {data.sellers.length}
            </p>
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Productos visibles
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {visibleProducts.length}
            </p>
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Productos ocultos
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              {hiddenProducts.length}
            </p>
          </div>
        </div>
      </section>

      {updatedMessage && (
        <section className="border-b border-[#dce4d6] bg-[#eef5ec]">
          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
            <p className="rounded-lg border border-[#b9d8b8] bg-white p-4 text-base font-black text-[#214e34] shadow-[0_10px_28px_rgba(31,52,41,0.05)]">
              {updatedMessage}
            </p>
          </div>
        </section>
      )}

      <section className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:px-10">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
                  Productos
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
                  Control de visibilidad
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-[#53645a]">
                Ocultar un producto lo quita de la página pública, pero no lo
                borra del negocio.
              </p>
            </div>

            {data.products.length > 0 ? (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {data.products.map((product) => (
                  <AdminProductCard
                    key={product.id}
                    product={product}
                    seller={
                      sellersBySlug[String(product.seller_slug ?? "").trim()] ??
                      null
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-[#dbe5d6] bg-white p-8 text-center shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
                <h3 className="text-2xl font-black text-[#1f3429]">
                  Todavía no hay productos.
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#53645a]">
                  Cuando los negocios agreguen productos, aparecerán aquí para
                  revisarlos.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
                  Negocios
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
                  Negocios registrados
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-[#53645a]">
                Aquí puedes revisar contacto, zona y si el panel ya quedó
                conectado.
              </p>
            </div>

            {data.sellers.length > 0 ? (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {data.sellers.map((seller) => (
                  <SellerReviewCard
                    key={seller.id ?? seller.email}
                    seller={seller}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-[#dbe5d6] bg-white p-8 text-center shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
                <h3 className="text-2xl font-black text-[#1f3429]">
                  Todavía no hay negocios registrados.
                </h3>
              </div>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next ?? "/admin");
  const errorMessage = getErrorMessage(params.error);
  const updatedMessage = getUpdatedMessage(params.updated);

  if (!isAdminAccessConfigured()) {
    return <AdminSetupMissing />;
  }

  if (!(await hasAdminSession())) {
    return <AdminLogin errorMessage={errorMessage} nextPath={nextPath} />;
  }

  const data = await getAdminModerationData();

  return <AdminDashboard data={data} updatedMessage={updatedMessage} />;
}
