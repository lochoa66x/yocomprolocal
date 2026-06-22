import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createSellerSlug } from "@/lib/slugs";
import { requireSellerAccess } from "@/lib/seller-auth";
import { getInitials } from "@/lib/storefront";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const metadata: Metadata = {
  title: "Editar datos | YoComproLocal",
  description:
    "Actualiza los datos de la página de tu negocio en YoComproLocal.",
};

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getProfileEditHref(sellerSlug: string, error?: string) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  const queryString = params.toString();

  return `/panel/vendedor/${encodeURIComponent(sellerSlug)}/perfil${
    queryString ? `?${queryString}` : ""
  }`;
}

function getDashboardProfileUpdatedHref(sellerSlug: string) {
  return `/panel/vendedor/${encodeURIComponent(sellerSlug)}?perfil=actualizado`;
}

function getErrorMessage(error?: string) {
  if (error === "missing") {
    return "Completa nombre, correo, WhatsApp, zona y descripción para guardar los datos.";
  }

  if (error === "server") {
    return "No pudimos actualizar los datos. Intenta de nuevo.";
  }

  if (error) {
    return "Algo salió mal. Revisa los datos e intenta de nuevo.";
  }

  return null;
}

async function updateSellerProfile(formData: FormData) {
  "use server";

  const currentSlug = getFormValue(formData, "currentSlug");
  const name = getFormValue(formData, "name");
  const email = getFormValue(formData, "email");
  const whatsapp = getFormValue(formData, "whatsapp");
  const zona = getFormValue(formData, "zona");
  const description = getFormValue(formData, "description");

  if (!currentSlug || !name || !email || !whatsapp || !zona || !description) {
    redirect(getProfileEditHref(currentSlug || "vendedor-local", "missing"));
  }

  const { seller: currentSeller, supabase } = await requireSellerAccess({
    slug: currentSlug,
    nextPath: getProfileEditHref(currentSlug),
  });

  if (!currentSeller?.name) {
    redirect(getProfileEditHref(currentSlug, "server"));
  }

  const currentName = currentSeller.name.trim();
  const nextSlug = createSellerSlug(name);
  const updateQuery = supabase
    .from("sellers")
    .update({
      slug: nextSlug,
      name,
      email,
      whatsapp,
      zona,
      description,
      updated_at: new Date().toISOString(),
    });

  const { error: sellerError } = currentSeller.id
    ? await updateQuery.eq("id", currentSeller.id)
    : await updateQuery.eq("name", currentName);

  if (sellerError) {
    console.error("Supabase seller profile update error:", sellerError);
    redirect(getProfileEditHref(currentSlug, "server"));
  }

  if (nextSlug !== currentSlug) {
    const { error: productError } = await supabase
      .from("products")
      .update({
        seller_slug: nextSlug,
        updated_at: new Date().toISOString(),
      })
      .eq("seller_slug", currentSlug);

    if (productError) {
      console.error("Supabase seller product slug update error:", productError);
      redirect(getProfileEditHref(nextSlug, "server"));
    }
  }

  redirect(getDashboardProfileUpdatedHref(nextSlug));
}

export default async function EditSellerProfilePage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const query = await searchParams;

  const { seller } = await requireSellerAccess({
    slug,
    nextPath: `/panel/vendedor/${slug}/perfil`,
  });

  if (!seller?.name) {
    notFound();
  }

  const name = seller.name.trim();
  const email = seller.email?.trim() || "";
  const whatsapp = seller.whatsapp?.trim() || "";
  const zona = seller.zona?.trim() || "";
  const description = seller.description?.trim() || "";
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
            href={`/panel/vendedor/${slug}`}
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
              Editar datos
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-[#1f3429] sm:text-5xl">
              Mantén tu negocio claro y fácil de contactar.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53645a]">
              Actualiza el nombre, WhatsApp, zona y descripción de tu negocio.
              Si cambias el nombre, también se ajustarán los links de tus
              productos.
            </p>

            <div className="mt-8 rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e8] text-xl font-black text-[#214e34]">
                  {getInitials(name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-black text-[#1f3429]">
                    {name}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[#6a7a70]">
                    {zona || "Cuautitlán Izcalli"}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-base leading-7 text-[#53645a]">
                {description ||
                  "Esta descripción aparecerá en la página de tu negocio."}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_10px_28px_rgba(31,52,41,0.06)] sm:p-8">
            {errorMessage && (
              <p className="mb-5 rounded-lg bg-[#fff1ec] p-4 text-sm font-semibold leading-6 text-[#a74429]">
                {errorMessage}
              </p>
            )}

            <form action={updateSellerProfile} className="space-y-5">
              <input type="hidden" name="currentSlug" value={slug} />

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  Nombre del negocio
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={name}
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={email}
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="whatsapp"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  WhatsApp
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  required
                  defaultValue={whatsapp}
                  placeholder="55 1234 5678"
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="zona"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  Zona en Izcalli
                </label>
                <input
                  id="zona"
                  name="zona"
                  type="text"
                  required
                  defaultValue={zona}
                  placeholder="ej. Centro Urbano, Hacienda, Las Fuentes..."
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-bold text-[#1f3429]"
                >
                  ¿Qué vendes?
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  defaultValue={description}
                  placeholder="Describe lo que vendes y cómo pueden pedirte por WhatsApp."
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base leading-7 text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
                >
                  Guardar datos
                </button>
                <a
                  href={`/panel/vendedor/${slug}`}
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
