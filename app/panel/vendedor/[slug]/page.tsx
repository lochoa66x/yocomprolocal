import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import CopyLinkButton from "./CopyLinkButton";
import {
  createProductRecordSlug,
  formatProductPrice,
  getProductCardDescription,
  type ProductRecord,
} from "@/lib/products";
import { ProductImageFrame } from "@/components/product-image-frame";
import {
  getInitials,
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
  step: string;
  text: string;
  title: string;
};

type ShareProduct = DashboardProductRecord & {
  editHref: string;
  productHref: string;
  productUrl: string;
  title: string;
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    producto?: string;
    productSlug?: string;
    registro?: string;
    perfil?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Panel del negocio | YoComproLocal",
  description:
    "Panel simple para agregar productos, copiar links y administrar tu página de negocio en YoComproLocal.",
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

function getAddProductLabel(productCount: number) {
  return productCount > 0
    ? "Agregar otro producto"
    : "Agrega tu primer producto";
}

function getStatusDescription(status: string | null) {
  if (status === "published") {
    return "Tus clientes pueden verlo en tu página y escribirte por WhatsApp.";
  }

  if (status === "draft") {
    return "Solo tú lo ves en este panel. Publícalo cuando esté listo.";
  }

  return "Revisa este producto antes de compartirlo.";
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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

function getDashboardProductActionHref({
  productSlug,
  productStatus,
  sellerSlug,
}: {
  productSlug?: string;
  productStatus?: string;
  sellerSlug: string;
}) {
  const params = new URLSearchParams();

  if (productStatus) {
    params.set("producto", productStatus);
  }

  if (productSlug) {
    params.set("productSlug", productSlug);
  }

  const queryString = params.toString();

  return `/panel/vendedor/${encodeURIComponent(sellerSlug)}${
    queryString ? `?${queryString}` : ""
  }`;
}

function getSellerShareMessage({
  publicSellerUrl,
  sellerName,
}: {
  publicSellerUrl: string;
  sellerName: string;
}) {
  return `Hola, soy ${sellerName}. Te comparto mi página en YoComproLocal: ${publicSellerUrl}`;
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
  return `${productTitle} disponible en ${sellerName}. ${priceLabel}. Pídelo directo por WhatsApp desde YoComproLocal: ${productUrl}`;
}

function getWhatsAppShareHref(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

async function updateProductStatus(formData: FormData) {
  "use server";

  const sellerSlug = getFormValue(formData, "sellerSlug");
  const productId = getFormValue(formData, "productId");
  const productSlug = getFormValue(formData, "productSlug");
  const nextStatusValue = getFormValue(formData, "nextStatus");
  const nextStatus = nextStatusValue === "draft" ? "draft" : "published";

  if (!sellerSlug || !productSlug) {
    redirect(
      getDashboardProductActionHref({
        sellerSlug: sellerSlug || "panel",
        productStatus: "error",
      })
    );
  }

  const { seller, supabase } = await requireSellerAccess({
    slug: sellerSlug,
    nextPath: getDashboardProductActionHref({ sellerSlug }),
  });

  let updateQuery = supabase
    .from("products")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("seller_slug", sellerSlug)
    .eq("slug", productSlug);

  if (productId) {
    updateQuery = updateQuery.eq("id", productId);
  }

  if (seller.id) {
    updateQuery = updateQuery.eq("seller_id", seller.id);
  }

  const { error } = await updateQuery;

  if (error) {
    console.error("Supabase product status update error:", error);
    redirect(
      getDashboardProductActionHref({
        sellerSlug,
        productStatus: "error",
      })
    );
  }

  redirect(
    getDashboardProductActionHref({
      productSlug,
      sellerSlug,
      productStatus: nextStatus === "published" ? "publicado" : "borrador",
    })
  );
}

function getDashboardTasks({
  addProductHref,
  editProfileHref,
  products,
  seller,
}: {
  addProductHref: string;
  editProfileHref: string;
  products: DashboardProductRecord[];
  seller: SellerRecord;
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
  const hasPublishedProduct = publishedProducts.length > 0;

  return [
    {
      step: "Paso 1",
      title: "Edita tu perfil",
      text: "Confirma nombre, zona, WhatsApp y descripción para que tus clientes sepan quién eres.",
      complete: profileReady,
      href: editProfileHref,
      actionLabel: "Editar perfil",
    },
    {
      step: "Paso 2",
      title: "Agrega un producto",
      text: "Sube una foto clara, pon precio y escribe una descripción sencilla.",
      complete: products.length > 0,
      href: addProductHref,
      actionLabel: "Agregar producto",
    },
    {
      step: "Paso 3",
      title: "Comparte tu tienda",
      text: "Copia tu link o manda el mensaje listo por WhatsApp para empezar a recibir pedidos.",
      complete: profileReady && hasPublishedProduct,
      href: "#accesos-rapidos",
      actionLabel: hasPublishedProduct
        ? "Compartir tienda"
        : "Publicar producto",
    },
  ];
}

function FirstRunChecklist({
  tasks,
}: {
  tasks: DashboardTask[];
}) {
  const completedTasks = tasks.filter((task) => task.complete).length;
  const readinessPercent = Math.round((completedTasks / tasks.length) * 100);
  const nextTask = tasks.find((task) => !task.complete);

  return (
    <section
      id="primeros-pasos"
      className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
            Primer recorrido
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-[#1f3429] sm:text-3xl">
            Tu tienda va {completedTasks} de {tasks.length} pasos.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#53645a]">
            {nextTask
              ? `Siguiente acción: ${nextTask.title.toLowerCase()}.`
              : "Listo: tu perfil, producto y link para compartir ya están en marcha."}
          </p>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#6a7a70]">
            Primero hacemos lo básico: perfil, producto y link para compartir.
          </p>
        </div>
        {nextTask ? (
          <a
            href={nextTask.href}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:w-auto"
          >
            {nextTask.actionLabel}
          </a>
        ) : (
          <a
            href="/productos"
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[#214e34] px-5 text-sm font-black text-white transition hover:bg-[#2f7c5b] sm:w-auto"
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

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {tasks.map((task) => (
          <article
            key={task.title}
            className={`rounded-lg border p-4 ${
              task.complete
                ? "border-[#b9d8b8] bg-[#eef5ec]"
                : "border-[#dbe5d6] bg-[#fbfbf7]"
            }`}
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
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                  {task.step}
                </p>
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

function DashboardShortcuts({
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
  const sellerWhatsAppHref = getWhatsAppShareHref(sellerMessage);
  const featuredProducts = products.slice(0, 3);
  const featuredProduct = featuredProducts[0] ?? null;
  const featuredProductMessage = featuredProduct
    ? getProductShareMessage({
        priceLabel: formatProductPrice(featuredProduct.price),
        productTitle: featuredProduct.title,
        productUrl: featuredProduct.productUrl,
        sellerName,
      })
    : "";
  const featuredProductWhatsAppHref = featuredProductMessage
    ? getWhatsAppShareHref(featuredProductMessage)
    : "";

  return (
    <section id="accesos-rapidos" className="scroll-mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
            Accesos rápidos
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-[#1f3429] sm:text-3xl">
            Lo que más vas a compartir.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#53645a]">
            Copia links, abre tu tienda y manda mensajes de WhatsApp sin buscar
            entre pantallas.
          </p>
        </div>
        <a
          href="#kit-compartir"
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec] sm:w-auto"
        >
          Ver kit completo
        </a>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <article className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
            Tienda pública
          </p>
          <h3 className="mt-2 text-xl font-black text-[#1f3429] sm:text-2xl">
            Link de tu negocio
          </h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#53645a]">
            Mándalo cuando alguien quiera ver todo lo que vendes.
          </p>
          <p className="mt-4 break-all rounded-lg bg-[#eef5ec] px-3 py-3 text-sm font-semibold leading-6 text-[#214e34]">
            {publicSellerUrl}
          </p>
          <div className="mt-4 grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-1">
            <CopyLinkButton
              copiedLabel="Link copiado"
              label="Copiar link"
              value={publicSellerUrl}
            />
            <a
              href={publicSellerHref}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#f7fbf4]"
            >
              Abrir tienda
            </a>
          </div>
        </article>

        <article className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
            Productos publicados
          </p>
          <h3 className="mt-2 text-xl font-black text-[#1f3429] sm:text-2xl">
            Links de producto
          </h3>
          {featuredProducts.length > 0 ? (
            <div className="mt-4 divide-y divide-[#dbe5d6]">
              {featuredProducts.map((product) => (
                <div key={product.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-black leading-5 text-[#1f3429]">
                        {product.title}
                      </p>
                      <p className="mt-1 text-xs font-black text-[#c05635]">
                        {formatProductPrice(product.price)}
                      </p>
                    </div>
                    <a
                      href={product.productHref}
                      className="shrink-0 text-sm font-black text-[#214e34] underline decoration-[#f6c55f] decoration-2 underline-offset-4 transition hover:text-[#2f7c5b]"
                    >
                      Abrir
                    </a>
                  </div>
                  <div className="mt-3 grid gap-2 min-[430px]:grid-cols-2">
                    <CopyLinkButton
                      copiedLabel="Link copiado"
                      label="Copiar link"
                      value={product.productUrl}
                      variant="secondary"
                    />
                    <a
                      href={getWhatsAppShareHref(
                        getProductShareMessage({
                          priceLabel: formatProductPrice(product.price),
                          productTitle: product.title,
                          productUrl: product.productUrl,
                          sellerName,
                        })
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-[#b9cbb4] bg-[#fbfbf7] p-4">
              <p className="text-sm font-semibold leading-6 text-[#53645a]">
                Publica un producto y aquí tendrás su link listo para copiar.
              </p>
              <a
                href={addProductHref}
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#f6c55f] px-4 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
              >
                Agregar producto
              </a>
            </div>
          )}
        </article>

        <article className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
            Mensajes listos
          </p>
          <h3 className="mt-2 text-xl font-black text-[#1f3429] sm:text-2xl">
            Para mandar por WhatsApp
          </h3>
          <p className="mt-3 rounded-lg bg-[#fbfbf7] px-3 py-3 text-sm font-semibold leading-6 text-[#53645a]">
            {sellerMessage}
          </p>
          <div className="mt-4 grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-1">
            <a
              href={sellerWhatsAppHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
            >
              Enviar tienda
            </a>
            <CopyLinkButton
              copiedLabel="Mensaje copiado"
              label="Copiar mensaje"
              value={sellerMessage}
              variant="secondary"
            />
          </div>
          {featuredProduct && (
            <div className="mt-5 border-t border-[#dbe5d6] pt-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Producto destacado
              </p>
              <p className="mt-2 line-clamp-2 text-sm font-black leading-5 text-[#1f3429]">
                {featuredProduct.title}
              </p>
              <div className="mt-3 grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-1">
                <a
                  href={featuredProductWhatsAppHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
                >
                  Enviar producto
                </a>
                <CopyLinkButton
                  copiedLabel="Mensaje copiado"
                  label="Copiar producto"
                  value={featuredProductMessage}
                  variant="secondary"
                />
              </div>
            </div>
          )}
        </article>
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
  const sellerWhatsAppHref = getWhatsAppShareHref(sellerMessage);

  return (
    <section id="kit-compartir" className="scroll-mt-8 pt-3">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2f7c5b]">
            Kit para compartir
          </p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-[#1f3429] sm:text-3xl">
            Links y mensajes listos.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#53645a]">
            Copia tu página o un producto para mandarlo por WhatsApp, Facebook,
            Instagram o grupos locales.
          </p>
        </div>
        <a
          href={publicSellerHref}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec] sm:w-auto"
        >
          Ver página de mi negocio
        </a>
      </div>

      <div className="mt-6 grid gap-4">
        <article className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Página del negocio
              </p>
              <h3 className="mt-2 text-xl font-black text-[#1f3429] sm:text-2xl">
                Comparte tu página de negocio
              </h3>
              <p className="mt-3 break-all rounded-lg bg-[#eef5ec] px-3 py-3 text-sm font-semibold leading-6 text-[#214e34]">
                {publicSellerUrl}
              </p>
            </div>
            <div className="grid gap-3 min-[430px]:grid-cols-2 lg:min-w-72 lg:grid-cols-1">
              <CopyLinkButton value={publicSellerUrl} />
              <a
                href={sellerWhatsAppHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
              >
                Enviar por WhatsApp
              </a>
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
              const whatsappShareHref = getWhatsAppShareHref(message);

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
                        <h3 className="min-w-0 break-words text-xl font-black leading-tight text-[#1f3429] sm:text-2xl">
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

                    <div className="grid gap-3 min-[430px]:grid-cols-2">
                      <a
                        href={product.productHref}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
                      >
                        Ver producto
                      </a>
                      <CopyLinkButton value={product.productUrl} />
                      <a
                        href={whatsappShareHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
                      >
                        Enviar WhatsApp
                      </a>
                      <CopyLinkButton
                        copiedLabel="Mensaje copiado"
                        label="Copiar WhatsApp"
                        value={message}
                        variant="secondary"
                      />
                      <CopyLinkButton
                        copiedLabel="Texto copiado"
                        label="Copiar texto"
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
              mensaje para WhatsApp y texto corto para redes.
            </p>
            <a
              href={addProductHref}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:w-auto"
            >
              Agregar producto
            </a>
          </article>
        )}
      </div>
    </section>
  );
}

function ProductReadyShareCard({
  product,
  publicSellerHref,
  sellerName,
}: {
  product: ShareProduct;
  publicSellerHref: string;
  sellerName: string;
}) {
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
  const whatsappShareHref = getWhatsAppShareHref(message);

  return (
    <article className="mt-5 overflow-hidden rounded-lg border border-[#b9d8b8] bg-white shadow-[0_14px_38px_rgba(31,52,41,0.08)]">
      <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
        <ProductImageFrame
          alt={product.title}
          badge={product.category?.trim() || "Producto"}
          className="min-h-64 lg:min-h-full"
          imageClassName="p-6"
          imageUrl={product.image_url}
        />

        <div className="p-5 sm:p-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2f7c5b]">
            Producto listo para compartir
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="break-words text-2xl font-black leading-tight text-[#1f3429] sm:text-3xl">
                {product.title}
              </h3>
              <p className="mt-2 text-lg font-black text-[#c05635]">
                {priceLabel}
              </p>
            </div>
            <a
              href={product.productHref}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec] sm:w-auto"
            >
              Ver producto
            </a>
          </div>

          <p className="mt-4 rounded-lg bg-[#eef5ec] px-4 py-3 text-sm font-semibold leading-6 text-[#214e34]">
            {caption}
          </p>

          <div className="mt-5 grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-4">
            <CopyLinkButton
              copiedLabel="Link copiado"
              label="Copiar link"
              value={product.productUrl}
            />
            <a
              href={whatsappShareHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
            >
              Compartir por WhatsApp
            </a>
            <CopyLinkButton
              copiedLabel="Mensaje copiado"
              label="Copiar mensaje"
              value={message}
              variant="secondary"
            />
            <a
              href={publicSellerHref}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
            >
              Ver mi negocio
            </a>
          </div>

          <div className="mt-5 rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
              Controles privados
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#53645a]">
              Esto solo lo ves tú. Tus clientes ven la página del producto, no
              estos botones de edición.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <a
                href={product.editHref}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-4 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec] sm:w-auto"
              >
                Editar producto
              </a>
              <a
                href={`${product.editHref}#eliminar-producto`}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#d49b87] bg-white px-4 text-sm font-black text-[#a74429] transition hover:bg-[#fff1ec] sm:w-auto"
              >
                Eliminar producto
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
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
  sellerSlug,
  siteUrl,
}: {
  product: DashboardProductRecord;
  sellerName: string;
  sellerSlug: string;
  siteUrl: string;
}) {
  const title = product.title?.trim() || "Producto local";
  const category = product.category?.trim() || "Producto local";
  const description =
    product.description?.trim() || "Producto publicado en YoComproLocal.";
  const productSlug = product.slug?.trim() || createProductRecordSlug(title);
  const productHref = `/vendedor/${sellerSlug}/producto/${productSlug}`;
  const productUrl = `${siteUrl}${productHref}`;
  const editProductHref = `/panel/vendedor/${sellerSlug}/producto/${productSlug}/editar`;
  const deleteProductHref = `${editProductHref}#eliminar-producto`;
  const status = product.status?.trim() || "draft";
  const priceLabel = formatProductPrice(product.price);
  const nextStatus = status === "published" ? "draft" : "published";
  const statusActionLabel =
    status === "published" ? "Ocultar a clientes" : "Publicar página";
  const productShareMessage = getProductShareMessage({
    priceLabel,
    productTitle: title,
    productUrl,
    sellerName,
  });
  const productWhatsAppShareHref = getWhatsAppShareHref(productShareMessage);

  return (
    <article className="overflow-hidden rounded-lg border border-[#dbe5d6] bg-white shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
      <div className="grid min-w-0 gap-0 md:grid-cols-[220px_1fr]">
        <ProductImageFrame
          alt={title}
          badge={category}
          className="min-h-52 md:min-h-full"
          imageClassName="p-5"
          imageUrl={product.image_url}
        />

        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words text-xl font-black leading-tight text-[#1f3429] sm:text-2xl">
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
            <p className="shrink-0 text-xl font-black text-[#c05635] sm:text-right">
              {priceLabel}
            </p>
          </div>

          {status === "published" ? (
            <div className="mt-5 rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Página que ven tus clientes
              </p>
              <p className="mt-2 break-all text-sm font-semibold leading-6 text-[#214e34]">
                {productUrl}
              </p>
              <p className="mt-3 rounded-lg bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#53645a]">
                {productShareMessage}
              </p>
              <div className="mt-4 grid gap-3 min-[430px]:grid-cols-2">
                <a
                  href={productHref}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
                >
                  Ver como cliente
                </a>
                <CopyLinkButton
                  copiedLabel="Link copiado"
                  label="Copiar link público"
                  value={productUrl}
                  variant="secondary"
                />
                <a
                  href={productWhatsAppShareHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
                >
                  Compartir por WhatsApp
                </a>
                <CopyLinkButton
                  copiedLabel="Mensaje copiado"
                  label="Copiar mensaje"
                  value={productShareMessage}
                  variant="secondary"
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-[#dbe5d6] bg-[#eef5ec] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Todavía no lo ven tus clientes
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645a]">
                Este producto está en borrador. Publícalo cuando quieras que
                tus clientes puedan verlo.
              </p>
            </div>
          )}

          <div className="mt-5 rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                  Acciones del producto
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#53645a]">
                  Estado:{" "}
                  <span className="font-black text-[#214e34]">
                    {getStatusLabel(status)}
                  </span>
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#6a7a70]">
                  {getStatusDescription(status)}
                </p>
              </div>
              <form action={updateProductStatus} className="lg:min-w-52">
                <input type="hidden" name="sellerSlug" value={sellerSlug} />
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="productSlug" value={productSlug} />
                <input type="hidden" name="nextStatus" value={nextStatus} />
                <button
                  type="submit"
                  className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-black transition ${
                    nextStatus === "published"
                      ? "bg-[#25d366] text-[#102318] hover:bg-[#39df78]"
                      : "border border-[#214e34]/20 bg-white text-[#214e34] hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
                  }`}
                >
                  {statusActionLabel}
                </button>
              </form>
            </div>

            <div className="mt-4 grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-4">
              {status === "published" ? (
                <a
                  href={productHref}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
                >
                  Ver como cliente
                </a>
              ) : (
                <p className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#eef5ec] px-5 text-center text-sm font-black text-[#53645a]">
                  Solo tú lo ves
                </p>
              )}

              <a
                href={editProductHref}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Editar producto
              </a>

              {status === "published" ? (
                <CopyLinkButton
                  copiedLabel="Link copiado"
                  label="Copiar link público"
                  value={productUrl}
                  variant="secondary"
                />
              ) : (
                <p className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#eef5ec] px-5 text-center text-sm font-black text-[#53645a]">
                  Sin link público
                </p>
              )}

              <a
                href={deleteProductHref}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#d49b87] bg-white px-5 text-sm font-black text-[#a74429] transition hover:bg-[#fff1ec]"
              >
                Eliminar
              </a>
            </div>

            {status === "published" && (
              <div className="mt-3 grid gap-3 min-[430px]:grid-cols-2">
                <a
                  href={productWhatsAppShareHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
                >
                  Compartir por WhatsApp
                </a>
                <CopyLinkButton
                  copiedLabel="Mensaje copiado"
                  label="Copiar mensaje"
                  value={productShareMessage}
                  variant="secondary"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyProductsState({ sellerSlug }: { sellerSlug: string }) {
  return (
    <section className="rounded-lg border border-dashed border-[#b9cbb4] bg-white p-6 shadow-[0_10px_28px_rgba(31,52,41,0.05)] sm:p-8">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
        Primer producto
      </p>
      <h2 className="mt-4 text-3xl font-black leading-tight text-[#1f3429]">
        Agrega tu primer producto para empezar a vender.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#53645a]">
        Empieza con el producto que más te piden. Con una foto, precio y
        descripción corta tendrás una página lista para mandar por WhatsApp.
      </p>

      <ol className="mt-6 grid gap-3 text-sm font-bold leading-6 text-[#53645a] md:grid-cols-3">
        <li className="border-l-4 border-[#f6c55f] pl-4">
          1. Sube una foto clara del producto.
        </li>
        <li className="border-l-4 border-[#f6c55f] pl-4">
          2. Agrega precio y categoría.
        </li>
        <li className="border-l-4 border-[#f6c55f] pl-4">
          3. Copia el link y envíalo a tus clientes.
        </li>
      </ol>

      <a
        href={`/producto/nuevo?seller=${sellerSlug}`}
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#f6c55f] px-6 text-base font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:w-auto"
      >
        Agrega tu primer producto
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
    "Negocio local registrado en YoComproLocal.";
  const siteUrl = getSiteUrl();
  const publicSellerHref = `/vendedor/${slug}`;
  const publicSellerUrl = `${siteUrl}${publicSellerHref}`;
  const addProductHref = `/producto/nuevo?seller=${slug}`;
  const addProductLabel = getAddProductLabel(products.length);
  const editProfileHref = `/panel/vendedor/${slug}/perfil`;
  const whatsappStatus = seller.whatsapp?.trim()
    ? "WhatsApp listo"
    : "Falta WhatsApp";
  const dashboardTasks = getDashboardTasks({
    addProductHref,
    editProfileHref,
    products,
    seller,
  });
  const allPublishedShareProducts = products
    .filter((product) => product.status === "published")
    .map<ShareProduct>((product) => {
      const title = product.title?.trim() || "Producto local";
      const productHref = getPublicProductHref(slug, product);

      return {
        ...product,
        editHref: getProductEditHref(slug, product),
        productHref,
        productUrl: `${siteUrl}${productHref}`,
        title,
      };
    });
  const shareProducts = allPublishedShareProducts.slice(0, 3);
  const requestedProductSlug = query.productSlug?.trim();
  const highlightedShareProduct = requestedProductSlug
    ? allPublishedShareProducts.find((product) => {
        const storedSlug = product.slug?.trim();

        return (
          storedSlug === requestedProductSlug ||
          createProductRecordSlug(product.title) === requestedProductSlug
        );
      }) ?? null
    : null;
  const showProductCreated = query.producto === "creado";
  const showProductUpdated = query.producto === "actualizado";
  const showProductPublished = query.producto === "publicado";
  const showProductDrafted = query.producto === "borrador";
  const showProductDeleted = query.producto === "eliminado";
  const showProductError = query.producto === "error";
  const showRegistrationCreated = query.registro === "creado";
  const showProfileUpdated = query.perfil === "actualizado";
  const productReadyToShare =
    showProductCreated || showProductUpdated || showProductPublished
      ? highlightedShareProduct ?? allPublishedShareProducts[0] ?? null
      : null;
  const productMessage = (() => {
    if (showProductCreated) {
      return "Producto publicado. Copia el link o compártelo por WhatsApp para empezar a recibir pedidos.";
    }

    if (showProductUpdated) {
      return "Cambios guardados. Revisa la página que ven tus clientes o copia el link actualizado.";
    }

    if (showProductPublished) {
      return "Producto publicado. Tus clientes ya pueden verlo en tu página.";
    }

    if (showProductDrafted) {
      return "Producto oculto. Tus clientes ya no lo ven, pero sigue guardado en tu panel.";
    }

    if (showProductDeleted) {
      return "Producto eliminado. Ya no aparece en tu panel ni en tu página.";
    }

    if (showProductError) {
      return "No pudimos actualizar el producto. Revisa tu conexión e intenta de nuevo.";
    }

    return "Producto publicado. Ya puedes compartirlo con tus clientes.";
  })();

  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <section className="border-b border-[#dce4d6] bg-[#173a2a] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:gap-4 sm:px-8 lg:px-10">
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
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href={publicSellerHref}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/35 px-3 text-sm font-bold text-white transition hover:bg-white/10 sm:px-4"
            >
              Mi página
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
            Panel del negocio
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="max-w-4xl break-words text-3xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                {sellerName}
              </h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-white/82">
                Este es tu espacio privado. Aquí agregas productos, copias
                links y revisas lo que tus clientes ven.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:shrink-0">
              <div className="max-w-full break-all rounded-2xl border border-white/18 bg-white/10 px-5 py-3 text-center text-sm font-bold leading-5 text-white/82 sm:rounded-full">
                {userEmail}
              </div>
              <a
                href={editProfileHref}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/35 px-6 text-base font-black text-white transition hover:bg-white/10 sm:w-auto"
              >
                Editar datos
              </a>
              <a
                href={addProductHref}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#f6c55f] px-6 text-base font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:w-auto"
              >
                {addProductLabel}
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
        showProductPublished ||
        showProductDrafted ||
        showProductDeleted ||
        showProductError ||
        showRegistrationCreated ||
        showProfileUpdated) && (
        <section className="border-b border-[#dce4d6] bg-[#eef5ec]">
          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
            <div className="rounded-lg border border-[#b9d8b8] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.05)]">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f7c5b]">
                {showRegistrationCreated
                  ? "Registro listo"
                  : showProfileUpdated
                  ? "Datos actualizados"
                  : showProductError
                  ? "Producto pendiente"
                  : "Producto listo"}
              </p>
              <p className="mt-2 text-lg font-bold leading-7 text-[#214e34]">
                {showRegistrationCreated
                  ? "Tu registro está listo. Agrega tu primer producto para empezar a compartir tu página."
                  : showProfileUpdated
                  ? "Datos actualizados. La página que ven tus clientes ya muestra los cambios."
                  : productMessage}
              </p>
            </div>
            {productReadyToShare && (
              <ProductReadyShareCard
                product={productReadyToShare}
                publicSellerHref={publicSellerHref}
                sellerName={sellerName}
              />
            )}
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
                <h2 className="break-words text-xl font-black text-[#1f3429] sm:text-2xl">
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

            <div className="mt-6 rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Tu espacio privado
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645a]">
                Solo tú ves esta pantalla. Tus clientes ven la página de tu
                negocio y las páginas de tus productos.
              </p>
            </div>

            <div className="mt-6 rounded-lg bg-[#eef5ec] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Página de tu negocio
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645a]">
                Este es el link que puedes mandar a clientes para mostrar tu
                negocio.
              </p>
              <p className="mt-3 break-all rounded-lg bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#214e34]">
                {publicSellerUrl}
              </p>
              <div className="mt-4 grid gap-3">
                <a
                  href={addProductHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
                >
                  {addProductLabel}
                </a>
                <CopyLinkButton
                  copiedLabel="Link copiado"
                  label="Copiar link de mi negocio"
                  value={publicSellerUrl}
                />
                <a
                  href={editProfileHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#214e34] px-5 text-sm font-black text-white transition hover:bg-[#2f7c5b]"
                >
                  Editar datos
                </a>
                <a
                  href={publicSellerHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#f7fbf4]"
                >
                  Ver mi página
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
            <FirstRunChecklist tasks={dashboardTasks} />

            <DashboardShortcuts
              addProductHref={addProductHref}
              products={shareProducts}
              publicSellerHref={publicSellerHref}
              publicSellerUrl={publicSellerUrl}
              sellerName={sellerName}
            />

            <ShareKit
              addProductHref={addProductHref}
              products={shareProducts}
              publicSellerHref={publicSellerHref}
              publicSellerUrl={publicSellerUrl}
              sellerName={sellerName}
            />

            <div
              id="productos-panel"
              className="scroll-mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
                  Productos
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-4xl">
                  Tus productos
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53645a]">
                  Cada producto puede tener su propia página para compartir y
                  recibir mensajes por WhatsApp.
                </p>
              </div>
              <a
                href={addProductHref}
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:w-auto"
              >
                {addProductLabel}
              </a>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-4">
                {products.map((product) => (
                  <DashboardProductCard
                    key={product.id}
                    product={product}
                    sellerName={sellerName}
                    sellerSlug={slug}
                    siteUrl={siteUrl}
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
