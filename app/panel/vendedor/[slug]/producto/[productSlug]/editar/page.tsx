import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import ProductAiAssistant from "@/app/producto/nuevo/ProductAiAssistant";
import {
  PRODUCT_CATEGORIES,
  createProductRecordSlug,
  type ProductRecord,
} from "@/lib/products";
import { uploadProductImage } from "@/lib/product-images";
import { getProductImageStyle, getSellerBySlug } from "@/lib/storefront";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

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
    "Edita la información de un producto publicado en YoComproLocal.",
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
    return "No pudimos subir la imagen. Revisa que el bucket product-images exista en Supabase.";
  }

  if (error === "price") {
    return "Revisa el precio. Debe ser un número igual o mayor a cero.";
  }

  if (error === "missing") {
    return "Completa los campos obligatorios para guardar el producto.";
  }

  if (error) {
    return "No pudimos actualizar el producto. Intenta de nuevo.";
  }

  return null;
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

function getDashboardUpdatedHref(sellerSlug: string) {
  return `/panel/vendedor/${encodeURIComponent(sellerSlug)}?producto=actualizado`;
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
  await connection();

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    return null;
  }

  const [seller, product] = await Promise.all([
    getSellerBySlug(supabase, sellerSlug),
    getProductForEdit(supabase, sellerSlug, productSlug),
  ]);

  if (!seller || !product) {
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

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    redirect(
      getEditProductHref({
        sellerSlug,
        productSlug: currentSlug,
        error: "server",
      })
    );
  }

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

  redirect(getDashboardUpdatedHref(sellerSlug));
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
  const imageStyle = getProductImageStyle(imageUrl);
  const errorMessage = getErrorMessage(query.error);

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
              Ajusta tu producto sin volver a empezar.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53645a]">
              Cambia precio, descripción, foto o estado. Al guardar, volverás a
              tu panel para seguir compartiendo tu vitrina.
            </p>

            <div
              className="mt-8 flex min-h-60 items-end overflow-hidden rounded-lg border border-[#dbe5d6] bg-[linear-gradient(135deg,#f6c55f_0%,#e37852_48%,#2f7c5b_100%)] bg-cover bg-center p-4 shadow-[0_14px_36px_rgba(31,52,41,0.08)]"
              style={imageStyle}
            >
              <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#214e34]">
                {category}
              </div>
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
                  <option value="published">Publicado</option>
                  <option value="draft">Borrador</option>
                </select>
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
          </div>
        </div>
      </section>
    </main>
  );
}
