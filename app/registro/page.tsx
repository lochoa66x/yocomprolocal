import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RegistrationSuccessActions } from "@/app/registro/RegistrationSuccessActions";
import { createSellerSlug } from "@/lib/slugs";
import {
  createSupabaseAdminClient,
  getSupabaseUser,
} from "@/lib/supabase-server";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getRegistrationHref({
  email,
  error,
}: {
  email?: string;
  error: string;
}) {
  const params = new URLSearchParams({
    error,
  });

  if (email) {
    params.set("email", email);
  }

  return `/registro?${params.toString()}`;
}

function getRegistrationErrorMessage(error?: string) {
  if (error === "missing") {
    return "Faltan datos. Revisa el formulario e intenta de nuevo.";
  }

  if (error === "email_exists") {
    return "Ya existe un negocio con ese correo. Entra al panel usando ese mismo correo.";
  }

  if (error === "duplicate") {
    return "Ese nombre de negocio ya estaba ocupado. Intenta agregar tu zona o una palabra extra al nombre.";
  }

  if (error) {
    return "Algo salió mal. Intenta de nuevo en un momento.";
  }

  return null;
}

async function sellerExistsForEmail(supabase: SupabaseClient, email: string) {
  const { data, error } = await supabase
    .from("sellers")
    .select("id")
    .ilike("email", email)
    .limit(1);

  if (error) {
    console.error("Supabase registration email lookup error:", error);
    return false;
  }

  return Boolean(data?.[0]);
}

async function getAvailableSellerSlug(
  supabase: SupabaseClient,
  baseSlug: string
) {
  const { data, error } = await supabase
    .from("sellers")
    .select("slug")
    .like("slug", `${baseSlug}%`)
    .limit(200);

  if (error) {
    console.error("Supabase registration slug lookup error:", error);
    return baseSlug;
  }

  const usedSlugs = new Set(
    (data ?? [])
      .map((seller) => String(seller.slug ?? "").trim())
      .filter(Boolean)
  );

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let index = 2; index <= 200; index += 1) {
    const nextSlug = `${baseSlug}-${index}`;

    if (!usedSlugs.has(nextSlug)) {
      return nextSlug;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

function isUniqueViolation(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    error.message?.toLowerCase().includes("duplicate key")
  );
}

async function submitRegistration(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    redirect(getRegistrationHref({ error: "server" }));
  }

  const name = getFormValue(formData, "name");
  const email = getFormValue(formData, "email").toLowerCase();
  const baseSlug = createSellerSlug(name);
  const slug = await getAvailableSellerSlug(supabase, baseSlug);

  if (
    !name ||
    !email ||
    !getFormValue(formData, "whatsapp") ||
    !getFormValue(formData, "zona") ||
    !getFormValue(formData, "description")
  ) {
    redirect(getRegistrationHref({ email, error: "missing" }));
  }

  const existingEmail = await sellerExistsForEmail(supabase, email);

  if (existingEmail) {
    redirect(getRegistrationHref({ email, error: "email_exists" }));
  }

  const user = await getSupabaseUser();
  const shouldAttachUser =
    user?.email?.trim().toLowerCase() === email ? user.id : null;

  const { error } = await supabase.from("sellers").insert([
    {
      slug,
      user_id: shouldAttachUser,
      name,
      email,
      whatsapp: getFormValue(formData, "whatsapp"),
      zona: getFormValue(formData, "zona"),
      description: getFormValue(formData, "description"),
    },
  ]);

  if (error) {
    console.error("Supabase error:", error);
    redirect(
      getRegistrationHref({
        email,
        error: isUniqueViolation(error) ? "duplicate" : "server",
      })
    );
  }

  const nextPath = `/panel/vendedor/${encodeURIComponent(
    slug
  )}?registro=creado`;

  if (shouldAttachUser) {
    redirect(nextPath);
  }

  const loginParams = new URLSearchParams({
    email,
    next: nextPath,
  });

  redirect(`/entrar?${loginParams.toString()}`);
}

interface Props {
  searchParams: Promise<{
    success?: string;
    error?: string;
    email?: string;
    seller?: string;
    slug?: string;
  }>;
}

export default async function RegistroPage({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams);
  const errorMessage = getRegistrationErrorMessage(params.error);
  const email = params.email?.trim().toLowerCase() ?? "";

  if (params.success) {
    const sellerSlug = params.seller ?? params.slug;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfbf7] p-4 text-[#1e261f]">
        <div className="w-full max-w-lg rounded-lg border border-[#dbe5d6] bg-white p-6 text-center shadow-[0_18px_45px_rgba(31,52,41,0.10)] sm:p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-[#e6f1e8] text-lg font-black text-[#214e34]">
            YCL
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#c05635]">
            Registro recibido
          </p>
          <h1 className="mt-3 text-3xl font-black text-[#1f3429]">
            Tu negocio quedó registrado.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#53645a]">
            Primero entra a tu panel privado. Desde ahí puedes agregar
            productos, revisar tu página pública y copiar links para compartir
            por WhatsApp.
          </p>

          {sellerSlug ? (
            <RegistrationSuccessActions sellerSlug={sellerSlug} />
          ) : (
            <a
              href="/registro"
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
            >
              Registrar otro vendedor
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbf7] px-5 py-8 text-[#1e261f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-3">
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
          <a
            href="/panel"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-4 text-sm font-bold text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec] sm:px-5"
          >
            Ya tengo cuenta
          </a>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <section className="rounded-lg bg-[#173a2a] p-6 text-white shadow-[0_18px_45px_rgba(31,52,41,0.14)] sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#f6c55f]">
              Paso 1 de 3
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              Registra tu negocio local.
            </h1>
            <p className="mt-5 text-lg font-semibold leading-8 text-white/84">
              Este formulario crea la base de tu panel privado y tu página
              pública. Después entrarás con el mismo correo para agregar tus
              productos.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Usa un correo al que puedas entrar ahora.",
                "Tu WhatsApp será el contacto directo para compradores.",
                "En el siguiente paso podrás subir productos con foto.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/12 bg-white/8 p-4"
                >
                  <p className="text-sm font-semibold leading-6 text-white/86">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <a
              href="/vender"
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-white/35 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/18"
            >
              Ver pasos para vender
            </a>
          </section>

          <section className="rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_18px_45px_rgba(31,52,41,0.10)] sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
              Datos del negocio
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429]">
              Quiero vender en YoComproLocal
            </h2>
            <p className="mt-4 text-base leading-7 text-[#53645a]">
              Completa estos datos y te llevaremos al acceso por correo para
              activar tu panel.
            </p>

            {errorMessage && (
              <p className="mt-5 rounded-lg bg-[#fff1ec] p-4 text-sm font-semibold leading-6 text-[#a74429]">
                {errorMessage}
              </p>
            )}

            {params.error === "email_exists" && (
              <a
                href={`/entrar?${new URLSearchParams({
                  email,
                  next: "/panel",
                }).toString()}`}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
              >
                Entrar con ese correo
              </a>
            )}

            <form action={submitRegistration} className="mt-7 space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#1f3429]">
                  Nombre o nombre del negocio
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="ej. La Cocina de Maria"
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition placeholder:text-[#8a988f] focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1f3429]">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={email}
                  placeholder="tu@negocio.com"
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition placeholder:text-[#8a988f] focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
                <p className="mt-2 text-xs font-semibold leading-5 text-[#6a7a70]">
                  Guarda este correo. Lo usarás para entrar al panel.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1f3429]">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  required
                  placeholder="55 1234 5678"
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition placeholder:text-[#8a988f] focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1f3429]">
                  Zona en Izcalli
                </label>
                <input
                  type="text"
                  name="zona"
                  required
                  placeholder="ej. Centro Urbano, Hacienda, Las Fuentes..."
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition placeholder:text-[#8a988f] focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1f3429]">
                  ¿Qué vendes?
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="ej. Tamales caseros, artesanías de madera, ropa deportiva..."
                  className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition placeholder:text-[#8a988f] focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
              >
                Registrar y abrir mi panel
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
