import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

async function submitRegistration(formData: FormData) {
  'use server'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables')
    redirect('/registro?error=1')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })

  const { error } = await supabase.from('sellers').insert([
    {
      name: getFormValue(formData, 'name'),
      email: getFormValue(formData, 'email'),
      whatsapp: getFormValue(formData, 'whatsapp'),
      zona: getFormValue(formData, 'zona'),
      description: getFormValue(formData, 'description'),
    },
  ])

  if (error) {
    console.error('Supabase error:', error)
    redirect('/registro?error=1')
  }

  redirect('/registro?success=1')
}

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>
}

export default async function RegistroPage({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams)

  if (params.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Listo!</h1>
          <p className="text-gray-600">
            Recibimos tu registro. Te avisamos por WhatsApp cuando tu perfil
            esté activo.
          </p>
        </div>
      </div>
    )
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
  )
}
