import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLoginHref } from "@/lib/seller-auth";
import {
  getInitials,
  getSellerByUser,
  getSellerRecordSlug,
} from "@/lib/storefront";
import {
  createSupabaseAdminClient,
  getSupabaseUser,
} from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Mi panel | YoComproLocal",
  description:
    "Acceso al panel de vendedor para administrar perfiles y productos en YoComproLocal.",
};

export default async function SellerPanelEntryPage() {
  const user = await getSupabaseUser();

  if (!user) {
    redirect(getLoginHref("/panel"));
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfbf7] px-5 py-12 text-[#1e261f]">
        <section className="w-full max-w-lg rounded-lg border border-[#dbe5d6] bg-white p-6 text-center shadow-[0_18px_45px_rgba(31,52,41,0.10)] sm:p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-[#e6f1e8] text-lg font-black text-[#214e34]">
            YCL
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
            Configuración pendiente
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-[#1f3429]">
            Falta conectar Supabase.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#53645a]">
            El panel necesita las variables de Supabase para encontrar tu perfil
            de vendedor.
          </p>
        </section>
      </main>
    );
  }

  const seller = await getSellerByUser(supabase, user);
  const sellerSlug = seller ? getSellerRecordSlug(seller) : "";

  if (seller && sellerSlug) {
    redirect(`/panel/vendedor/${sellerSlug}`);
  }

  const email = user.email?.trim() || "esta cuenta";
  const initials = getInitials(email);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfbf7] px-5 py-12 text-[#1e261f]">
      <section className="w-full max-w-xl rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_18px_45px_rgba(31,52,41,0.10)] sm:p-8">
        <a
          href="/"
          className="flex w-fit items-center gap-3 font-semibold"
          aria-label="YoComproLocal inicio"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e8] text-sm font-black text-[#214e34] shadow-sm">
            YCL
          </span>
          <span className="text-lg tracking-wide">YoComproLocal</span>
        </a>

        <div className="mt-8 flex items-center gap-4 rounded-lg bg-[#eef5ec] p-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-white text-base font-black text-[#214e34]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#567164]">
              Sesión activa
            </p>
            <p className="mt-1 break-all text-base font-black text-[#214e34]">
              {email}
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
          Perfil no encontrado
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-[#1f3429] sm:text-4xl">
          Todavía no hay un negocio conectado a este correo.
        </h1>
        <p className="mt-4 text-base leading-7 text-[#53645a]">
          Esto suele pasar cuando el negocio se registró con otro correo. Para
          entrar al panel, usa exactamente el correo que escribiste en el
          registro de tu negocio.
        </p>

        <div className="mt-6 rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#567164]">
            Qué puedes hacer ahora
          </p>
          <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-[#53645a]">
            <li>Usar otro correo si recuerdas con cuál registraste.</li>
            <li>Registrar tu negocio con este correo si aún no lo hiciste.</li>
            <li>Revisar el paso a paso si quieres empezar desde cero.</li>
          </ul>
        </div>

        <div className="mt-8 grid gap-3">
          <a
            href="/auth/salir"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
          >
            Entrar con otro correo
          </a>
          <a
            href="/registro"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-base font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
          >
            Registrar negocio con este correo
          </a>
          <a
            href="/vender"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-base font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
          >
            Ver cómo empezar
          </a>
        </div>
      </section>
    </main>
  );
}
