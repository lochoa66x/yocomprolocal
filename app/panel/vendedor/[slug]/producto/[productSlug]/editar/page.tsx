import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import ProductAiAssistant from "@/app/producto/nuevo/ProductAiAssistant";
import {
  PRODUCT_CATEGORIES,
  createProductRecordSlug,
  type ProductRecord,
} from "@/lib/products";
import { ProductImageFrame } from "@/components/product-image-frame";
import { uploadProductImage } from "@/lib/product-images";
import { requireSellerAccess } from "@/lib/seller-auth";

type EditableProductRecord = ProductRecord & {
  status: string | null;
};

type EditProductPageData = {
  product: EditableProductRecord;
};

type Props = {
  params: Promise<{ slug: string; productSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const metadata: Metadata = {
  title: "Editar producto | YoComproLocal",
  description:
    "Edita la información de un producto de tu negocio en YoComproLocal.",
};

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getProductImageFile(formData: FormData) {
  const file = formData.get("imageFile");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return file;
}

function getErrorMessage(error?: string) {
  if (error === "image-size") {
    return "La imagen es muy pesada. Sube una foto de máximo 5 MB.";
  }

  if (error === "image-type") {
    return "La imagen debe ser JPG, PNG, WebP o GIF.";
  }

  if (error === "image-upload") {
    return "No pudimos subir la imagen. Intenta con otra foto o vuelve a intentarlo en unos minutos.";
  }

  if (error === "price") {
    return "Revisa el precio. Debe ser un número igual o mayor a cero.";
  }

  if (error === "missing") {
    return "Completa los campos obligatorios para guardar el producto.";
  }

  if (error === "delete-confirm") {
    return "Para eliminarlo, primero marca la casilla de confirmación.";
  }

  if (error === "delete") {
    return "No pudimos eliminar el producto. Intenta de nuevo en un momento.";
  }

  if (error) {
    return "No pudimos guardar los cambios. Intenta de nuevo en un momento.";
  }

  return null;
}

function getStatusHelpText(status: string) {
  if (status === "draft") {
    return "Ahora está en borrador: solo tú lo ves en tu panel.";
  }

  return "Ahora está publicado: tus clientes lo pueden ver y escribirte por WhatsApp.";
}

function getEditProductHref({
  sellerSlug,
  productSlug,
  error,
}: {
  sellerSlug: string;
  productSlug: string;
  error?: string;
}) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  const queryString = params.toString();

  return `/panel/vendedor/${encodeURIComponent(
    sellerSlug
  )}/producto/${encodeURIComponent(productSlug)}/editar${
    queryString ? `?${queryString}` : ""
  }`;
}

function getDashboardUpdatedHref(sellerSlug: string, productSlug: string) {
  const params = new URLSearchParams({
    producto: "actualizado",
    productSlug,
  });

  return `/panel/vendedor/${encodeURIComponent(
    sellerSlug
  )}?${params.toString()}`;
}

function getDashboardDeletedHref(sellerSlug: string) {
  return `/panel/vendedor/${encodeURIComponent(sellerSlug)}?producto=eliminado`;
}

async function getProductForEdit(
  supabase: SupabaseClient,
  sellerSlug: string,
  productSlug: string
) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, seller_slug, title, slug, price, category, description, image_url, status"
    )
    .eq("seller_slug", sellerSlug)
    .eq("slug", productSlug)
    .limit(1);

  if (error) {
    console.error("Supabase edit product lookup error:", error);
    return null;
  }

  return ((data ?? []) as EditableProductRecord[])[0] ?? null;
}

async function getEditProductPageData(
  sellerSlug: string,
  productSlug: string
): Promise<EditProductPageData | null> {
  const { supabase } = await requireSellerAccess({
    slug: sellerSlug,
    nextPath: `/panel/vendedor/${sellerSlug}/producto/${productSlug}/editar`,
  });
  const product = await getProductForEdit(supabase, sellerSlug, productSlug);

  if (!product) {
    return null;
  }

  return {
    product,
  };
}

async function updateProduct(formData: FormData) {
  "use server";

  const sellerSlug = getFormValue(formData, "sellerSlug");
  const currentSlug = getFormValue(formData, "currentSlug");
  const title = getFormValue(formData, "title");
  const priceValue = Number(getFormValue(formData, "price"));
  const category = getFormValue(formData, "category");
  const description = getFormValue(formData, "description");
  const status = getFormValue(formData, "status") || "published";
  const fallbackImageUrl = getFormValue(formData, "imageUrl");
  const imageFile = getProductImageFile(formData);

  if (!sellerSlug || !currentSlug || !title || !category || !description) {
    redirect(
      getEditProductHref({
        sellerSlug,
        productSlug: currentSlug,
        error: "missing",
      })
    );
  }

  if (!Number.isFinite(priceValue) || priceValue < 0) {
    redirect(
      getEditProductHref({
        sellerSlug,
        productSlug: currentSlug,
        error: "price",
      })
    );
  }

  const { seller, supabase } = await requireSellerAccess({
    slug: sellerSlug,
    nextPath: getEditProductHref({
      sellerSlug,
      productSlug: currentSlug,
    }),
  });

  let imageUrl = fallbackImageUrl || null;

  if (imageFile) {
    const upload = await uploadProductImage({
      supabase,
      file: imageFile,
      productTitle: title,
      sellerSlug,
    });

    if (upload.error) {
      redirect(
        getEditProductHref({
          sellerSlug,
          productSlug: currentSlug,
          error: upload.error,
        })
      );
    }

    imageUrl = upload.publicUrl;
  }

  const nextSlug = createProductRecordSlug(title);
  const { error } = await supabase
    .from("products")
    .update({
      seller_id: seller.id,
      title,
      slug: nextSlug,
      price: priceValue,
      category,
      description,
      image_url: imageUrl,
      status: status === "draft" ? "draft" : "published",
      updated_at: new Date().toISOString(),
    })
    .eq("seller_slug", sellerSlug)
    .eq("slug", currentSlug);

  if (error) {
    console.error("Supabase product update error:", error);
    redirect(
      getEditProductHref({
        sellerSlug,
        productSlug: currentSlug,
        error: "server",
      })
    );
  }

  redirect(getDashboardUpdatedHref(sellerSlug, nextSlug));
}

async function deleteProduct(formData: FormData) {
  "use server";

  const sellerSlug = getFormValue(formData, "sellerSlug");
  const currentSlug = getFormValue(formData, "currentSlug");
  const confirmDelete = getFormValue(formData, "confirmDelete");

  if (!sellerSlug || !currentSlug) {
    redirect(
      getEditProductHref({
        sellerSlug,
        productSlug: currentSlug,
        error: "delete",
      })
    );
  }

  if (confirmDelete !== "yes") {
    redirect(
      getEditProductHref({
        sellerSlug,
        productSlug: currentSlug,
        error: "delete-confirm",
      })
    );
  }

  const { seller, supabase } = await requireSellerAccess({
    slug: sellerSlug,
    nextPath: getEditProductHref({
      sellerSlug,
      productSlug: currentSlug,
    }),
  });

  let deleteQuery = supabase
    .from("products")
    .delete()
    .eq("seller_slug", sellerSlug)
    .eq("slug", currentSlug);

  if (seller.id) {
    deleteQuery = deleteQuery.eq("seller_id", seller.id);
  }

  const { error } = await deleteQuery;

  if (error) {
    console.error("Supabase product delete error:", error);
    redirect(
      getEditProductHref({
        sellerSlug,
        productSlug: currentSlug,
        error: "delete",
      })
    );
  }

  redirect(getDashboardDeletedHref(sellerSlug));
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const { slug: sellerSlug, productSlug } = await params;
  const query = await searchParams;
  const pageData = await getEditProductPageData(sellerSlug, productSlug);

  if (!pageData) {
    notFound();
  }

  const { product } = pageData;
  const title = product.title?.trim() || "Producto local";
  const category = product.category?.trim() || "Producto local";
  const description = product.description?.trim() || "";
  const status = product.status?.trim() || "published";
  const imageUrl = product.image_url?.trim() || "";
  const errorMessage = getErrorMessage(query.error);
  const isDraft = status === "draft";

  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <section className="border-b border-[#dce4d6] bg-[#173a2a] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
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
            href={`/panel/vendedor/${sellerSlug}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#f6c55f] px-4 text-sm font-black text-[#1c261f] transition hover:bg-[#ffd77a]"
          >
            Volver al panel
          </a>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
              Editar producto
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-[#1f3429] sm:text-5xl">
              Actualiza tu producto sin volver a capturarlo.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53645a]">
              Cambia precio, descripción, foto o si tus clientes lo pueden ver.
              Si todavía no está listo, déjalo como borrador.
            </p>
            <div className="mt-6 rounded-lg border border-[#dbe5d6] bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Control del producto
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#53645a]">
                Publicado significa que tus clientes lo pueden ver. Borrador lo
                guarda solo en tu panel. Eliminar es permanente.
              </p>
            </div>

            <ProductImageFrame
              alt={title}
              badge={category}
              className="mt-8 min-h-60 rounded-lg border border-[#dbe5d6] shadow-[0_14px_36px_rgba(31,52,41,0.08)]"
              imageUrl={imageUrl}
            />
            <div
              className={`mt-4 rounded-lg border p-4 ${
                isDraft
                  ? "border-[#f0d6a2] bg-[#fff8ec]"
                  : "border-[#b9d8b8] bg-[#eef5ec]"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#567164]">
                Estado actual
              </p>
              <p className="mt-2 text-lg font-black text-[#1f3429]">
                {isDraft ? "Borrador privado" : "Visible para clientes"}
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#53645a]">
                {getStatusHelpText(status)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:p-8">
            {errorMessage && (
              <p className="mb-5 rounded-lg bg-[#fff1ec] p-4 text-sm font-semibold leading-6 text-[#a74429]">
                {errorMessage}
              </p>
            )}

            <form
              id="edit-product-form"
              action={updateProduct}
              className="space-y-5"
              encType="multipart/form-data"
            >
              <input type="hidden" name="sellerSlug" value={sellerSlug} />
              <input type="hidden" name="currentSlug" value={productSlug} />

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  Nombre del producto
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  defaultValue={title}
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-bold text-[#1f3429]"
                  >
                    Precio
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={String(product.price ?? "")}
                    className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-bold text-[#1f3429]"
                  >
                    Categoría
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    defaultValue={category}
                    className="mt-2 w-full rounded-lg border border-[#cddcc9] bg-white px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                  >
                    {PRODUCT_CATEGORIES.map((productCategory) => (
                      <option key={productCategory} value={productCategory}>
                        {productCategory}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  defaultValue={description}
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base leading-7 text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

              <ProductAiAssistant formId="edit-product-form" />

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  defaultValue={status === "draft" ? "draft" : "published"}
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] bg-white px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                >
                  <option value="published">
                  Publicado - visible para clientes
                  </option>
                  <option value="draft">Borrador - solo tú lo ves</option>
                </select>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#6a7a70]">
                  Publicado aparece en la página de tu negocio. Borrador se
                  queda guardado solo en tu panel.
                </p>
              </div>

              <div>
                <label
                  htmlFor="imageFile"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  Reemplazar foto
                </label>
                <input
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="mt-2 w-full rounded-lg border border-dashed border-[#cddcc9] bg-[#fbfbf7] px-4 py-4 text-sm text-[#53645a] outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#214e34] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
                <p className="mt-2 text-xs font-semibold leading-5 text-[#6a7a70]">
                  Si subes una nueva foto, reemplazará la imagen actual. Máximo
                  5 MB.
                </p>
              </div>

              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  URL de imagen
                </label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  defaultValue={imageUrl}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
                >
                  Guardar cambios
                </button>
                <a
                  href={`/panel/vendedor/${sellerSlug}`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-base font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
                >
                  Cancelar
                </a>
              </div>
            </form>

            <div
              id="eliminar-producto"
              className="mt-8 scroll-mt-8 rounded-lg border border-[#f2c4b2] bg-[#fff8f5] p-5"
            >
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#a74429]">
                Zona de cuidado
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#1f3429]">
                Eliminar producto
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6a4f45]">
                Eliminar es permanente para este producto. Si solo quieres
                ocultarlo, cambia el estado a Borrador y guarda cambios.
              </p>
              <a
                href="#status"
                className="mt-3 inline-flex text-sm font-black text-[#a74429] underline decoration-[#f6c55f] decoration-2 underline-offset-4"
              >
                Prefiero moverlo a borrador
              </a>
              <form action={deleteProduct} className="mt-4 space-y-4">
                <input type="hidden" name="sellerSlug" value={sellerSlug} />
                <input type="hidden" name="currentSlug" value={productSlug} />
                <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#6a4f45]">
                  <input
                    type="checkbox"
                    name="confirmDelete"
                    value="yes"
                    className="mt-1 size-4 rounded border-[#d49b87] text-[#a74429]"
                  />
                  Sí, quiero eliminar este producto de forma permanente.
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#d49b87] bg-white px-5 text-sm font-black text-[#a74429] transition hover:bg-[#fff1ec]"
                >
                  Eliminar definitivamente
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
