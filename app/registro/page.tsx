import { redirect } from "next/navigation";
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

  redirect(`/registro?success=1&slug=${encodeURIComponent(slug)}`);
}

interface Props {
  searchParams: Promise<{ success?: string; error?: string; slug?: string }>;
}

export default async function RegistroPage({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams);

  if (params.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Listo!</h1>
          <p className="text-gray-600">
            Recibimos tu registro y preparamos tu perfil público. Puedes
            revisar cómo se ve y compartirlo cuando quieras.
          </p>
          {params.slug && (
            <a
              href={`/vendedor/${params.slug}`}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Ver perfil público
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
