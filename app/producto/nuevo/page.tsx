import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  PRODUCT_CATEGORIES,
  createProductRecordSlug,
} from "@/lib/products";
import { createSellerSlug } from "@/lib/slugs";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

type Props = {
  searchParams: Promise<{ seller?: string; error?: string }>;
};

export const metadata: Metadata = {
  title: "Nuevo producto | YoComproLocal",
  description:
    "Carga un producto para publicarlo en un perfil local de YoComproLocal.",
};

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getErrorMessage(error?: string) {
  if (error === "seller") {
    return "No encontramos ese vendedor. Revisa el slug o registra primero el negocio.";
  }

  if (error === "price") {
    return "Revisa el precio. Debe ser un número igual o mayor a cero.";
  }

  if (error === "missing") {
    return "Completa los campos obligatorios para publicar el producto.";
  }

  if (error) {
    return "No pudimos guardar el producto. Intenta de nuevo.";
  }

  return null;
}

async function sellerExists(sellerSlug: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("sellers")
    .select("name")
    .limit(200);

  if (error) {
    console.error("Supabase seller lookup error:", error);
    return false;
  }

  return (data ?? []).some((seller) => {
    const name = String(seller.name ?? "").trim();
    return name && createSellerSlug(name) === sellerSlug;
  });
}

async function submitProduct(formData: FormData) {
  "use server";

  const sellerSlug = createSellerSlug(getFormValue(formData, "sellerSlug"));
  const title = getFormValue(formData, "title");
  const priceValue = Number(getFormValue(formData, "price"));
  const category = getFormValue(formData, "category");
  const description = getFormValue(formData, "description");
  const imageUrl = getFormValue(formData, "imageUrl");

  if (!sellerSlug || !title || !category || !description) {
    redirect("/producto/nuevo?error=missing");
  }

  if (!Number.isFinite(priceValue) || priceValue < 0) {
    redirect(
      `/producto/nuevo?seller=${encodeURIComponent(sellerSlug)}&error=price`
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    redirect(
      `/producto/nuevo?seller=${encodeURIComponent(sellerSlug)}&error=server`
    );
  }

  const hasSeller = await sellerExists(sellerSlug);

  if (!hasSeller) {
    redirect(
      `/producto/nuevo?seller=${encodeURIComponent(sellerSlug)}&error=seller`
    );
  }

  const slug = createProductRecordSlug(title);

  const { error } = await supabase.from("products").upsert(
    [
      {
        seller_slug: sellerSlug,
        title,
        slug,
        price: priceValue,
        category,
        description,
        image_url: imageUrl || null,
        status: "published",
      },
    ],
    {
      onConflict: "seller_slug,slug",
    }
  );

  if (error) {
    console.error("Supabase product save error:", error);
    redirect(
      `/producto/nuevo?seller=${encodeURIComponent(sellerSlug)}&error=server`
    );
  }

  redirect(`/vendedor/${encodeURIComponent(sellerSlug)}`);
}

export default async function NewProductPage({ searchParams }: Props) {
  const params = await searchParams;
  const sellerSlug = params.seller ?? "la-cocina-de-maria";
  const errorMessage = getErrorMessage(params.error);

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
            href={`/vendedor/${sellerSlug}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/35 px-4 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Ver perfil
          </a>
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
              Esta es la primera versión del flujo para vendedores: agrega los
              datos básicos, guarda el producto y vuelve al perfil público para
              verlo publicado.
            </p>
          </div>

          <div className="rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:p-8">
            {errorMessage && (
              <p className="mb-5 rounded-lg bg-[#fff1ec] p-4 text-sm font-semibold leading-6 text-[#a74429]">
                {errorMessage}
              </p>
            )}

            <form action={submitProduct} className="space-y-5">
              <div>
                <label
                  htmlFor="sellerSlug"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  Slug del vendedor
                </label>
                <input
                  id="sellerSlug"
                  name="sellerSlug"
                  type="text"
                  required
                  defaultValue={sellerSlug}
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
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
                  placeholder="https://..."
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

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
