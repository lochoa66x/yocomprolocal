import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  getWhatsAppHref,
  type SellerRecord,
} from "@/lib/storefront";
import { requireSellerAccess } from "@/lib/seller-auth";

type DashboardProductRecord = ProductRecord & {
  status: string | null;
};

type SellerDashboard = {
  seller: SellerRecord;
  products: DashboardProductRecord[];
  userEmail: string;
};

type DashboardTask = {
  actionLabel: string;
  complete: boolean;
  href: string;
  text: string;
  title: string;
};

type ShareProduct = DashboardProductRecord & {
  productHref: string;
  productUrl: string;
  title: string;
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    producto?: string;
    registro?: string;
    perfil?: string;
  }>;
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

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function getProductEditHref(sellerSlug: string, product: DashboardProductRecord) {
  const title = product.title?.trim() || "producto-local";
  const productSlug = product.slug?.trim() || createProductRecordSlug(title);

  return `/panel/vendedor/${sellerSlug}/producto/${productSlug}/editar`;
}

function getPublicProductHref(
  sellerSlug: string,
  product: DashboardProductRecord
) {
  const title = product.title?.trim() || "producto-local";
  const productSlug = product.slug?.trim() || createProductRecordSlug(title);

  return `/vendedor/${sellerSlug}/producto/${productSlug}`;
}

function getSellerShareMessage({
  publicSellerUrl,
  sellerName,
}: {
  publicSellerUrl: string;
  sellerName: string;
}) {
  return `Hola, soy ${sellerName}. Te comparto mi tienda en YoComproLocal: ${publicSellerUrl}`;
}

function getProductShareMessage({
  priceLabel,
  productTitle,
  productUrl,
  sellerName,
}: {
  priceLabel: string;
  productTitle: string;
  productUrl: string;
  sellerName: string;
}) {
  return `Hola, te comparto ${productTitle} de ${sellerName}. Precio: ${priceLabel}. Puedes verlo aquí: ${productUrl}`;
}

function getProductCaption({
  priceLabel,
  productTitle,
  productUrl,
  sellerName,
}: {
  priceLabel: string;
  productTitle: string;
  productUrl: string;
  sellerName: string;
}) {
  return `${productTitle} disponible en ${sellerName}. ${priceLabel}. Pide directo por WhatsApp desde YoComproLocal: ${productUrl}`;
}

function getDashboardTasks({
  addProductHref,
  editProfileHref,
  products,
  publicSellerHref,
  seller,
  slug,
}: {
  addProductHref: string;
  editProfileHref: string;
  products: DashboardProductRecord[];
  publicSellerHref: string;
  seller: SellerRecord;
  slug: string;
}): DashboardTask[] {
  const profileReady = [
    seller.name,
    seller.email,
    seller.whatsapp,
    seller.zona,
    seller.description,
  ].every(hasText);
  const publishedProducts = products.filter(
    (product) => product.status === "published"
  );
  const productsWithPhotos = products.filter((product) =>
    hasText(product.image_url)
  );
  const firstProductWithoutPhoto = products.find(
    (product) => !hasText(product.image_url)
  );

  return [
    {
      title: "Completa tu perfil",
      text: "Nombre, zona, descripción, correo y WhatsApp listos.",
      complete: profileReady,
      href: editProfileHref,
      actionLabel: "Editar perfil",
    },
    {
      title: "Publica tu primer producto",
      text: "Agrega un producto con precio, categoría y descripción.",
      complete: products.length > 0,
      href: addProductHref,
      actionLabel: "Agregar producto",
    },
    {
      title: "Muestra una foto real",
      text: "Una buena foto ayuda a que el producto se vea confiable.",
      complete: productsWithPhotos.length > 0,
      href: firstProductWithoutPhoto
        ? getProductEditHref(slug, firstProductWithoutPhoto)
        : addProductHref,
      actionLabel: "Subir foto",
    },
    {
      title: "Ten una página pública activa",
      text: "Al menos un producto publicado debe verse en tu vitrina.",
      complete: publishedProducts.length > 0,
      href:
        publishedProducts[0] && publishedProducts[0].slug
          ? `/vendedor/${slug}/producto/${publishedProducts[0].slug}`
          : publicSellerHref,
      actionLabel: "Ver página",
    },
    {
      title: "Lista para compartir",
      text: "Perfil, WhatsApp y producto publicado preparados para clientes.",
      complete: profileReady && publishedProducts.length > 0,
      href: publicSellerHref,
      actionLabel: "Compartir",
    },
  ];
}

function ReadinessPanel({
  tasks,
}: {
  tasks: DashboardTask[];
}) {
  const completedTasks = tasks.filter((task) => task.complete).length;
  const readinessPercent = Math.round((completedTasks / tasks.length) * 100);
  const nextTask = tasks.find((task) => !task.complete);

  return (
    <section className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
            Lista de avance
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429]">
            Tu tienda va {completedTasks} de {tasks.length}.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#53645a]">
            {nextTask
              ? `Siguiente paso: ${nextTask.title.toLowerCase()}.`
              : "Tu tienda ya tiene lo básico para recibir clientes."}
          </p>
        </div>
        {nextTask ? (
          <a
            href={nextTask.href}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
          >
            {nextTask.actionLabel}
          </a>
        ) : (
          <a
            href="/productos"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#214e34] px-5 text-sm font-black text-white transition hover:bg-[#2f7c5b]"
          >
            Ver productos
          </a>
        )}
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#eef5ec]">
        <div
          className="h-full rounded-full bg-[#25d366]"
          style={{ width: `${readinessPercent}%` }}
        />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {tasks.map((task) => (
          <article
            key={task.title}
            className="rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                  task.complete
                    ? "bg-[#25d366] text-[#102318]"
                    : "bg-[#fff1d8] text-[#8a5b14]"
                }`}
                aria-hidden="true"
              >
                {task.complete ? "✓" : "•"}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-black text-[#1f3429]">
                  {task.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#53645a]">
                  {task.text}
                </p>
                {!task.complete && (
                  <a
                    href={task.href}
                    className="mt-3 inline-flex text-sm font-black text-[#214e34] underline decoration-[#f6c55f] decoration-2 underline-offset-4 transition hover:text-[#2f7c5b]"
                  >
                    {task.actionLabel}
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ShareKit({
  addProductHref,
  products,
  publicSellerHref,
  publicSellerUrl,
  sellerName,
}: {
  addProductHref: string;
  products: ShareProduct[];
  publicSellerHref: string;
  publicSellerUrl: string;
  sellerName: string;
}) {
  const sellerMessage = getSellerShareMessage({
    publicSellerUrl,
    sellerName,
  });

  return (
    <section className="pt-3">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2f7c5b]">
            Kit para compartir
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429]">
            Links y mensajes listos.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#53645a]">
            Copia tu tienda o un producto para mandarlo por WhatsApp, Facebook,
            Instagram o grupos locales.
          </p>
        </div>
        <a
          href={publicSellerHref}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
        >
          Ver tienda pública
        </a>
      </div>

      <div className="mt-6 grid gap-4">
        <article className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Tienda completa
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#1f3429]">
                Comparte tu página de vendedor
              </h3>
              <p className="mt-3 break-all rounded-lg bg-[#eef5ec] px-3 py-3 text-sm font-semibold leading-6 text-[#214e34]">
                {publicSellerUrl}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-72 lg:grid-cols-1">
              <CopyLinkButton value={publicSellerUrl} />
              <CopyLinkButton
                copiedLabel="Mensaje copiado"
                label="Copiar mensaje"
                value={sellerMessage}
                variant="secondary"
              />
            </div>
          </div>
        </article>

        {products.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {products.map((product) => {
              const priceLabel = formatProductPrice(product.price);
              const message = getProductShareMessage({
                priceLabel,
                productTitle: product.title,
                productUrl: product.productUrl,
                sellerName,
              });
              const caption = getProductCaption({
                priceLabel,
                productTitle: product.title,
                productUrl: product.productUrl,
                sellerName,
              });

              return (
                <article
                  key={product.id}
                  className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                        Producto publicado
                      </p>
                      <div className="mt-2 flex items-start justify-between gap-4">
                        <h3 className="text-2xl font-black leading-tight text-[#1f3429]">
                          {product.title}
                        </h3>
                        <p className="shrink-0 text-lg font-black text-[#c05635]">
                          {priceLabel}
                        </p>
                      </div>
                      <p className="mt-3 rounded-lg bg-[#fbfbf7] px-3 py-3 text-sm font-semibold leading-6 text-[#53645a]">
                        {caption}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <a
                        href={product.productHref}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
                      >
                        Ver producto
                      </a>
                      <CopyLinkButton value={product.productUrl} />
                      <CopyLinkButton
                        copiedLabel="Mensaje copiado"
                        label="Copiar WhatsApp"
                        value={message}
                        variant="secondary"
                      />
                      <CopyLinkButton
                        copiedLabel="Caption copiado"
                        label="Copiar caption"
                        value={caption}
                        variant="secondary"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <article className="rounded-lg border border-dashed border-[#b9cbb4] bg-white p-6 text-center shadow-[0_10px_28px_rgba(31,52,41,0.05)]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
              Productos pendientes
            </p>
            <h3 className="mt-3 text-2xl font-black text-[#1f3429]">
              Publica un producto para generar mensajes de venta.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#53645a]">
              Cuando tengas productos publicados, aparecerán aquí con su link,
              mensaje para WhatsApp y caption corto.
            </p>
            <a
              href={addProductHref}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
            >
              Agregar producto
            </a>
          </article>
        )}
      </div>
    </section>
  );
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
  const { seller, supabase, user } = await requireSellerAccess({
    slug,
    nextPath: `/panel/vendedor/${slug}`,
  });
  const products = await getSellerProducts(supabase, slug);

  return {
    seller,
    products,
    userEmail: user.email ?? "sesión activa",
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
  const editProductHref = `/panel/vendedor/${sellerSlug}/producto/${productSlug}/editar`;
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

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

            <a
              href={editProductHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
            >
              Editar
            </a>

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

  const { seller, products, userEmail } = dashboard;
  const sellerName = seller.name?.trim();

  if (!sellerName) {
    notFound();
  }

  const zona = seller.zona?.trim() || "Cuautitlán Izcalli";
  const description =
    seller.description?.trim() ||
    "Vendedor local registrado en YoComproLocal.";
  const siteUrl = getSiteUrl();
  const publicSellerHref = `/vendedor/${slug}`;
  const publicSellerUrl = `${siteUrl}${publicSellerHref}`;
  const addProductHref = `/producto/nuevo?seller=${slug}`;
  const editProfileHref = `/panel/vendedor/${slug}/perfil`;
  const whatsappStatus = seller.whatsapp?.trim()
    ? "WhatsApp listo"
    : "Falta WhatsApp";
  const dashboardTasks = getDashboardTasks({
    addProductHref,
    editProfileHref,
    products,
    publicSellerHref,
    seller,
    slug,
  });
  const shareProducts = products
    .filter((product) => product.status === "published")
    .slice(0, 3)
    .map<ShareProduct>((product) => {
      const title = product.title?.trim() || "Producto local";
      const productHref = getPublicProductHref(slug, product);

      return {
        ...product,
        productHref,
        productUrl: `${siteUrl}${productHref}`,
        title,
      };
    });
  const showProductCreated = query.producto === "creado";
  const showProductUpdated = query.producto === "actualizado";
  const showRegistrationCreated = query.registro === "creado";
  const showProfileUpdated = query.perfil === "actualizado";
  const productMessage = showProductUpdated
    ? "Producto actualizado. Tu vitrina ya muestra los cambios."
    : "Producto publicado. Ya puedes compartirlo con tus clientes.";

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
          <div className="flex shrink-0 items-center gap-3">
            <a
              href={publicSellerHref}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/35 px-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Ver página pública
            </a>
            <a
              href="/auth/salir"
              className="hidden min-h-10 items-center justify-center rounded-full bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15 sm:inline-flex"
            >
              Cerrar sesión
            </a>
          </div>
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
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <div className="rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-bold text-white/82">
                {userEmail}
              </div>
              <a
                href={editProfileHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 text-base font-black text-white transition hover:bg-white/10"
              >
                Editar perfil
              </a>
              <a
                href={addProductHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f6c55f] px-6 text-base font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
              >
                Agregar producto
              </a>
            </div>
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

      {(showProductCreated ||
        showProductUpdated ||
        showRegistrationCreated ||
        showProfileUpdated) && (
        <section className="border-b border-[#dce4d6] bg-[#eef5ec]">
          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
            <div className="rounded-lg border border-[#b9d8b8] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.05)]">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f7c5b]">
                {showRegistrationCreated
                  ? "Registro listo"
                  : showProfileUpdated
                  ? "Perfil actualizado"
                  : "Producto listo"}
              </p>
              <p className="mt-2 text-lg font-bold leading-7 text-[#214e34]">
                {showRegistrationCreated
                  ? "Tu registro está listo. Agrega tu primer producto para empezar a compartir tu tienda."
                  : showProfileUpdated
                  ? "Perfil actualizado. Tu página pública ya muestra los cambios."
                  : productMessage}
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
                  href={editProfileHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#214e34] px-5 text-sm font-black text-white transition hover:bg-[#2f7c5b]"
                >
                  Editar perfil
                </a>
                <a
                  href={publicSellerHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#f7fbf4]"
                >
                  Ver mi página pública
                </a>
                <a
                  href="/auth/salir"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#f7fbf4] sm:hidden"
                >
                  Cerrar sesión
                </a>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <ReadinessPanel tasks={dashboardTasks} />

            <ShareKit
              addProductHref={addProductHref}
              products={shareProducts}
              publicSellerHref={publicSellerHref}
              publicSellerUrl={publicSellerUrl}
              sellerName={sellerName}
            />

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
