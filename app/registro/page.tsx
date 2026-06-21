import { redirect } from "next/navigation";
import { RegistrationSuccessActions } from "@/app/registro/RegistrationSuccessActions";
import { createSellerSlug } from "@/lib/slugs";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function submitRegistration(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.error("Missing Supabase environment variables");
    redirect("/registro?error=1");
  }

  const name = getFormValue(formData, "name");

  const { error } = await supabase.from("sellers").insert([
    {
      name,
      email: getFormValue(formData, "email"),
      whatsapp: getFormValue(formData, "whatsapp"),
      zona: getFormValue(formData, "zona"),
      description: getFormValue(formData, "description"),
    },
  ]);

  if (error) {
    console.error("Supabase error:", error);
    redirect("/registro?error=1");
  }

  const slug = createSellerSlug(name);

  redirect(`/registro?success=1&seller=${encodeURIComponent(slug)}`);
}

interface Props {
  searchParams: Promise<{
    success?: string;
    error?: string;
    seller?: string;
    slug?: string;
  }>;
}

export default async function RegistroPage({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams);

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
          <h1 className="mt-3 text-3xl font-black text-[#1f3429]">¡Listo!</h1>
          <p className="mt-4 text-base leading-7 text-[#53645a]">
            Recibimos tu registro y ya puedes revisar tu perfil público. El
            siguiente paso natural es agregar tu primer producto para tener una
            página lista para compartir por WhatsApp.
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quiero vender en YoComproLocal
        </h1>
        <p className="text-gray-500 mb-6 text-sm">
          Llena este formulario y te contactamos por WhatsApp para activar tu
          perfil.
        </p>

        {params.error && (
          <p className="text-red-500 text-sm mb-4">
            Algo salió mal. Intenta de nuevo.
          </p>
        )}

        <form action={submitRegistration} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre o nombre del negocio
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <input
              type="tel"
              name="whatsapp"
              required
              placeholder="55 1234 5678"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona en Izcalli
            </label>
            <input
              type="text"
              name="zona"
              required
              placeholder="ej. Centro Urbano, Hacienda, Las Fuentes..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué vendes?
            </label>
            <textarea
              name="description"
              required
              rows={3}
              placeholder="ej. Tamales caseros, artesanías de madera, ropa deportiva..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Enviar registro
          </button>
        </form>
      </div>
    </div>
  );
}
