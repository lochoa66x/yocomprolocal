import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  createSupabaseAdminClient,
  createSupabaseAuthClient,
} from "@/lib/supabase-server";
import { getAuthRedirectOrigin } from "@/lib/site-url";

type Props = {
  searchParams: Promise<{
    email?: string;
    error?: string;
    next?: string;
    sent?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Entrar | YoComproLocal",
  description:
    "Acceso para vendedores de YoComproLocal con enlace seguro por correo.",
};

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getSafeNextPath(nextPath: string) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/panel";
  }

  return nextPath;
}

function getLoginHref({
  email,
  error,
  nextPath,
  sent,
}: {
  email?: string;
  error?: string;
  nextPath?: string;
  sent?: string;
}) {
  const params = new URLSearchParams();

  if (email) {
    params.set("email", email);
  }

  if (error) {
    params.set("error", error);
  }

  if (nextPath) {
    params.set("next", getSafeNextPath(nextPath));
  }

  if (sent) {
    params.set("sent", sent);
  }

  const queryString = params.toString();

  return `/entrar${queryString ? `?${queryString}` : ""}`;
}

async function sellerExistsForEmail(email: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return true;
  }

  const { data, error } = await supabase
    .from("sellers")
    .select("id")
    .ilike("email", email)
    .limit(1);

  if (error) {
    console.error("Supabase seller login lookup error:", error);
    return true;
  }

  return Boolean(data?.[0]);
}

async function sendMagicLink(formData: FormData) {
  "use server";

  const email = getFormValue(formData, "email").toLowerCase();
  const nextPath = getSafeNextPath(getFormValue(formData, "next"));

  if (!email) {
    redirect(getLoginHref({ error: "missing", nextPath }));
  }

  const sellerExists = await sellerExistsForEmail(email);

  if (!sellerExists) {
    redirect(getLoginHref({ email, error: "no_seller", nextPath }));
  }

  const supabase = await createSupabaseAuthClient();

  if (!supabase) {
    console.error("Missing Supabase auth environment variables");
    redirect(getLoginHref({ email, error: "server", nextPath }));
  }

  const origin = await getAuthRedirectOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", nextPath);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("Supabase magic link error:", error);
    redirect(getLoginHref({ email, error: "server", nextPath }));
  }

  redirect(getLoginHref({ email, nextPath, sent: "1" }));
}

function getErrorMessage(error?: string) {
  if (error === "missing") {
    return "Escribe tu correo para enviarte el link.";
  }

  if (error === "callback") {
    return "No pudimos abrir ese enlace. Escribe tu correo y usa el enlace nuevo más reciente.";
  }

  if (error === "no_seller") {
    return "No encontramos un negocio con ese correo. Revisa si usaste otro correo o registra tu negocio primero.";
  }

  if (error === "server") {
    return "No pudimos enviar el link. Revisa la configuración de Supabase e intenta de nuevo.";
  }

  if (error) {
    return "Algo salió mal. Intenta de nuevo.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next ?? "/panel");
  const email = params.email?.trim().toLowerCase() ?? "";
  const errorMessage = getErrorMessage(params.error);
  const linkSent = params.sent === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfbf7] px-5 py-12 text-[#1e261f]">
      <section className="w-full max-w-md rounded-lg border border-[#dbe5d6] bg-white p-6 shadow-[0_18px_45px_rgba(31,52,41,0.10)] sm:p-8">
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

        <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
          Acceso vendedor
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-[#1f3429]">
          Entra a tu panel con un enlace por correo.
        </h1>
        <p className="mt-4 text-base leading-7 text-[#53645a]">
          Usa el mismo correo con el que registraste tu negocio. Te enviaremos
          un botón seguro para abrir tu panel privado sin contraseña.
        </p>

        <div className="mt-5 rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-4">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#567164]">
            Para evitar errores
          </p>
          <p className="mt-2 text-sm leading-6 text-[#53645a]">
            El acceso depende del correo, no del WhatsApp. Si registraste tu
            negocio con otro correo, sal y solicita el enlace con ese correo.
          </p>
        </div>

        {linkSent && (
          <div className="mt-6 rounded-lg border border-[#b9d8b8] bg-[#eef5ec] p-4">
            <p className="text-sm font-black text-[#214e34]">
              Link enviado.
            </p>
            <p className="mt-1 text-sm leading-6 text-[#53645a]">
              Revisa tu correo y abre el enlace para continuar a tu panel
              privado.
            </p>
          </div>
        )}

        {errorMessage && (
          <p className="mt-6 rounded-lg bg-[#fff1ec] p-4 text-sm font-semibold leading-6 text-[#a74429]">
            {errorMessage}
          </p>
        )}

        <form action={sendMagicLink} className="mt-7 space-y-5">
          <input type="hidden" name="next" value={nextPath} />

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
              placeholder="tu@negocio.com"
              className="mt-2 w-full rounded-lg border border-[#cddcc9] px-4 py-3 text-base text-[#1e261f] outline-none transition focus:border-[#2f7c5b] focus:ring-2 focus:ring-[#2f7c5b]/20"
            />
          </div>

          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-base font-black text-[#102318] transition hover:bg-[#39df78]"
          >
            Enviarme enlace de acceso
          </button>
        </form>

        <p className="mt-6 text-center text-sm leading-6 text-[#6a7a70]">
          ¿Todavía no tienes perfil?{" "}
          <a href="/vender" className="font-black text-[#214e34] underline">
            Ver cómo empezar
          </a>
        </p>
      </section>
    </main>
  );
}
