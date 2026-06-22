import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductAiAssistant from "@/app/producto/nuevo/ProductAiAssistant";
import ProductPhotoPreviewField from "@/app/producto/nuevo/ProductPhotoPreviewField";
import {
  PRODUCT_CATEGORIES,
  createProductRecordSlug,
} from "@/lib/products";
import { uploadProductImage } from "@/lib/product-images";
import { requireSellerAccess } from "@/lib/seller-auth";
import { createSellerSlug } from "@/lib/slugs";

type Props = {
  searchParams: Promise<{ seller?: string; error?: string }>;
};

export const metadata: Metadata = {
  title: "Nuevo producto | YoComproLocal",
  description:
    "Agrega un producto para compartirlo desde tu negocio en YoComproLocal.",
};

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getErrorMessage(error?: string) {
  if (error === "seller") {
    return "No encontramos ese negocio. Revisa el enlace o registra primero tu negocio.";
  }

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
    return "Completa los datos básicos para publicar tu producto.";
  }

  if (error) {
    return "No pudimos guardar el producto. Intenta de nuevo en un momento.";
  }

  return null;
}

function getProductImageFile(formData: FormData) {
  const file = formData.get("imageFile");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return file;
}

function getNewProductHref({
  sellerSlug,
  error,
}: {
  sellerSlug?: string;
  error?: string;
}) {
  const params = new URLSearchParams();

  if (sellerSlug) {
    params.set("seller", sellerSlug);
  }

  if (error) {
    params.set("error", error);
  }

  const queryString = params.toString();
  return queryString ? `/producto/nuevo?${queryString}` : "/producto/nuevo";
}

function getSellerDashboardHref(sellerSlug: string, productSlug: string) {
  const params = new URLSearchParams({
    producto: "creado",
    productSlug,
  });

  return `/panel/vendedor/${encodeURIComponent(
    sellerSlug
  )}?${params.toString()}`;
}

async function submitProduct(formData: FormData) {
  "use server";

  const sellerSlug = createSellerSlug(getFormValue(formData, "sellerSlug"));
  const title = getFormValue(formData, "title");
  const priceValue = Number(getFormValue(formData, "price"));
  const category = getFormValue(formData, "category");
  const description = getFormValue(formData, "description");
  const fallbackImageUrl = getFormValue(formData, "imageUrl");
  const imageFile = getProductImageFile(formData);

  if (!sellerSlug || !title || !category || !description) {
    redirect(getNewProductHref({ sellerSlug, error: "missing" }));
  }

  if (!Number.isFinite(priceValue) || priceValue < 0) {
    redirect(getNewProductHref({ sellerSlug, error: "price" }));
  }

  const { seller, supabase } = await requireSellerAccess({
    slug: sellerSlug,
    nextPath: getNewProductHref({ sellerSlug }),
  });

  const slug = createProductRecordSlug(title);
  let imageUrl = fallbackImageUrl || null;

  if (imageFile) {
    const upload = await uploadProductImage({
      supabase,
      file: imageFile,
      productTitle: title,
      sellerSlug,
    });

    if (upload.error) {
      redirect(getNewProductHref({ sellerSlug, error: upload.error }));
    }

    imageUrl = upload.publicUrl;
  }

  const { error } = await supabase.from("products").upsert(
    [
      {
        seller_id: seller.id,
        seller_slug: sellerSlug,
        title,
        slug,
        price: priceValue,
        category,
        description,
        image_url: imageUrl,
        status: "published",
      },
    ],
    {
      onConflict: "seller_slug,slug",
    }
  );

  if (error) {
    console.error("Supabase product save error:", error);
    redirect(getNewProductHref({ sellerSlug, error: "server" }));
  }

  redirect(getSellerDashboardHref(sellerSlug, slug));
}

export default async function NewProductPage({ searchParams }: Props) {
  const params = await searchParams;
  const sellerSlug = createSellerSlug(params.seller ?? "la-cocina-de-maria");
  const errorMessage = getErrorMessage(params.error);

  await requireSellerAccess({
    slug: sellerSlug,
    nextPath: getNewProductHref({ sellerSlug }),
  });

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
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`/vendedor/${sellerSlug}`}
              className="hidden min-h-10 items-center justify-center rounded-full border border-white/35 px-4 text-sm font-bold text-white transition hover:bg-white/10 sm:inline-flex"
            >
              Ver mi página
            </a>
            <a
              href={`/panel/vendedor/${sellerSlug}`}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#f6c55f] px-4 text-sm font-black text-[#1c261f] transition hover:bg-[#ffd77a]"
            >
              Volver al panel
            </a>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
              Nuevo producto
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-[#1f3429] sm:text-5xl">
              Publica un producto en minutos.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53645a]">
              Agrega los datos básicos, guarda el producto y vuelve al panel
              para compartirlo por WhatsApp.
            </p>
          </div>

          <div className="rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:p-8">
            {errorMessage && (
              <p className="mb-5 rounded-lg bg-[#fff1ec] p-4 text-sm font-semibold leading-6 text-[#a74429]">
                {errorMessage}
              </p>
            )}

            <form
              id="new-product-form"
              action={submitProduct}
              className="space-y-5"
              encType="multipart/form-data"
            >
              <div>
                <label
                  htmlFor="sellerSlug"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  Negocio
                </label>
                <input
                  id="sellerSlug"
                  name="sellerSlug"
                  type="text"
                  required
                  readOnly
                  defaultValue={sellerSlug}
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] bg-[#eef5ec] px-4 py-3 text-base font-semibold text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

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
                  placeholder="ej. Tamales caseros"
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
                    placeholder="25"
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
                    defaultValue="Comida"
                    className="mt-2 w-full rounded-lg border border-[#cddcc9] bg-white px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                  >
                    {PRODUCT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
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
                  placeholder="Describe el producto como se lo explicarías a un cliente por WhatsApp."
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base leading-7 text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

              <ProductAiAssistant formId="new-product-form" />

              <ProductPhotoPreviewField
                fileHelpText="JPG, PNG, WebP o GIF. Máximo 5 MB."
                fileLabel="Foto del producto"
                previewAlt="Vista previa del producto"
                urlHelpText="Usa este campo solo si todavía no tienes una foto para subir."
                urlLabel="URL de imagen opcional"
              />

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
              >
                Publicar producto
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
