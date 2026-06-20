import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createSellerSlug } from "@/lib/slugs";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

type Seller = {
  name: string | null;
  whatsapp: string | null;
  zona: string | null;
  description: string | null;
};

type Props = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Vendedor local | YoComproLocal",
  description:
    "Perfil público de vendedor local en YoComproLocal para contactar directo por WhatsApp.",
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getWhatsAppHref(whatsapp: string, sellerName: string) {
  const digits = whatsapp.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const phone = digits.startsWith("52") ? digits : `52${digits}`;
  const message = `Hola, vi el perfil de ${sellerName} en YoComproLocal y me interesa lo que vende.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

async function getSellerBySlug(slug: string) {
  await connection();

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    return null;
  }

  const { data, error } = await supabase
    .from("sellers")
    .select("name, whatsapp, zona, description")
    .limit(100);

  if (error) {
    console.error("Supabase error:", error);
    return null;
  }

  const sellers = (data ?? []) as Seller[];

  return sellers.find((seller) => {
    const name = String(seller.name ?? "").trim();
    return name && createSellerSlug(name) === slug;
  });
}

export default async function SellerProfilePage({ params }: Props) {
  const { slug } = await params;
  const seller = await getSellerBySlug(slug);

  if (!seller?.name) {
    notFound();
  }

  const name = seller.name.trim();
  const zona = seller.zona?.trim() || "Cuautitlán Izcalli";
  const description =
    seller.description?.trim() ||
    "Vendedor local registrado en YoComproLocal.";
  const whatsappHref = seller.whatsapp
    ? getWhatsAppHref(seller.whatsapp, name)
    : null;

  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <section className="relative isolate overflow-hidden bg-[#173a2a] text-white">
        <Image
          src="/images/yocomprolocal-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-[#173a2a]/76" />
        <div className="relative z-10 mx-auto flex min-h-[52svh] w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
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
            <a
              href="/registro"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-4 text-sm font-bold text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:px-5"
            >
              Quiero vender
            </a>
          </header>

          <div className="flex flex-1 items-end pb-8 pt-20 sm:pb-12">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#f6c55f]">
                Vendedor local
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-6xl">
                {name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-white/88">
                {zona}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce4d6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-0 divide-y divide-[#dce4d6] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          <div className="py-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Zona
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">{zona}</p>
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Contacto
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              Directo por WhatsApp
            </p>
          </div>
          <div className="py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
              Plataforma
            </p>
            <p className="mt-2 text-2xl font-black text-[#214e34]">
              YoComproLocal
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <aside className="rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_10px_28px_rgba(31,52,41,0.06)]">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e8] text-xl font-black text-[#214e34]">
                {getInitials(name)}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-[#1f3429]">{name}</h2>
                <p className="mt-1 text-sm font-semibold text-[#6a7a70]">
                  {zona}
                </p>
              </div>
            </div>

            <p className="mt-6 text-base leading-7 text-[#53645a]">
              {description}
            </p>

            {whatsappHref ? (
              <a
                href={whatsappHref}
                className="mt-6 inline-flex w-full min-h-12 items-center justify-center rounded-full bg-[#25d366] px-5 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
              >
                Contactar por WhatsApp
              </a>
            ) : (
              <p className="mt-6 rounded-lg bg-[#eef5ec] p-4 text-sm font-semibold leading-6 text-[#53645a]">
                Este vendedor todavía no agregó WhatsApp público.
              </p>
            )}
          </aside>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
                Productos
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
                Productos de este vendedor
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53645a]">
                Este espacio será la vitrina pública donde cada producto tenga
                foto, precio, descripción con IA y botón para contactar directo.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-lg border border-[#dbe5d6] bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
                  Próximo paso
                </p>
                <h3 className="mt-4 text-2xl font-black text-[#1f3429]">
                  Carga de productos
                </h3>
                <p className="mt-3 text-base leading-7 text-[#53645a]">
                  El vendedor podrá subir una foto, precio y datos básicos para
                  crear una página lista para compartir.
                </p>
              </article>

              <article className="rounded-lg border border-[#dbe5d6] bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
                  IA
                </p>
                <h3 className="mt-4 text-2xl font-black text-[#1f3429]">
                  Texto listo para vender
                </h3>
                <p className="mt-3 text-base leading-7 text-[#53645a]">
                  Generaremos descripción, etiquetas y mensaje de WhatsApp para
                  que el producto se vea más profesional.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
