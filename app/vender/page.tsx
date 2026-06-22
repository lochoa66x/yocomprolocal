import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiero vender | YoComproLocal",
  description:
    "Guía simple para registrar tu negocio, entrar al panel y publicar productos en YoComproLocal.",
};

const steps = [
  {
    label: "Paso 1",
    title: "Registra tu negocio",
    text: "Escribe el nombre, zona, WhatsApp y el correo que vas a usar para entrar a tu panel.",
  },
  {
    label: "Paso 2",
    title: "Abre tu panel privado",
    text: "Te mandamos un enlace por correo. No necesitas contraseña; solo abre el correo en tu teléfono o computadora.",
  },
  {
    label: "Paso 3",
    title: "Sube productos y comparte",
    text: "Agrega foto, precio y descripción. Cada producto tendrá su propia página para mandar por WhatsApp.",
  },
];

const requirements = [
  "Nombre del negocio",
  "Correo al que sí puedas entrar",
  "WhatsApp donde atiendes pedidos",
  "Zona en Cuautitlán Izcalli",
  "Una descripción corta de lo que vendes",
  "Fotos de tus productos para el siguiente paso",
];

export default function SellOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <section className="bg-[#173a2a] text-white">
        <div className="mx-auto flex max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
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
              href="/panel"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/35 bg-white/10 px-4 text-sm font-bold text-white backdrop-blur transition hover:bg-white/18 sm:px-5"
            >
              Ya tengo cuenta
            </a>
          </header>

          <div className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#f6c55f]">
                Vende mejor, sin complicarte
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
                Empieza tu página local en YoComproLocal.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/86">
                Te guiamos paso a paso para que tu negocio tenga una página
                clara, productos fáciles de compartir y mensajes listos para
                WhatsApp.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/registro"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f6c55f] px-6 text-base font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
                >
                  Registrar mi negocio
                </a>
                <a
                  href="/panel"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/45 bg-white/10 px-6 text-base font-black text-white backdrop-blur transition hover:bg-white/18"
                >
                  Entrar a mi panel
                </a>
              </div>
            </div>

            <aside className="rounded-lg border border-white/12 bg-white/9 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur sm:p-6">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f6c55f]">
                Importante
              </p>
              <h2 className="mt-3 text-2xl font-black leading-tight">
                Usa siempre el mismo correo.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/82">
                El panel se abre con el correo que registraste. Si intentas
                entrar con otro correo, el sistema no encontrará tu negocio y
                te pedirá registrarlo de nuevo.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce4d6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-px bg-[#dce4d6] sm:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="bg-white px-5 py-7 sm:px-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c05635]">
                {step.label}
              </p>
              <h2 className="mt-3 text-2xl font-black text-[#214e34]">
                {step.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-[#53645a]">
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2f7c5b]">
              Antes de empezar
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
              Ten esto a la mano.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#53645a]">
              El registro debe sentirse como llenar una tarjeta de negocio:
              rápido, claro y sin palabras raras.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {requirements.map((requirement) => (
              <div
                key={requirement}
                className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-lg bg-[#e6f1e8] text-sm font-black text-[#214e34]"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <p className="mt-4 text-base font-semibold leading-7 text-[#25372d]">
                  {requirement}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6c55f] py-12 text-[#1c261f]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7a3a25]">
              Primer paso real
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Registra tu negocio y entra al panel con ese correo.
            </h2>
          </div>
          <a
            href="/registro"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#173a2a] px-6 text-base font-black text-white transition hover:bg-[#214e34]"
          >
            Registrar mi negocio
          </a>
        </div>
      </section>
    </main>
  );
}
