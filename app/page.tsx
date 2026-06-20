"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Locale = "es" | "en";

const content = {
  es: {
    pageTitle: "YoComproLocal | Compra local. Vende mejor.",
    languageButton: "EN",
    languageLabel: "Cambiar a inglés",
    logoLabel: "YoComproLocal inicio",
    navLabel: "Navegación principal",
    nav: {
      sellers: "Vendedores",
      how: "Cómo funciona",
      mvp: "MVP",
      city: "Izcalli",
    },
    cta: "Quiero vender",
    heroAlt: "Vendedora local preparando productos para compartirlos en línea",
    eyebrow: "Compra local. Vende mejor.",
    heroTitle: "YoComproLocal",
    heroLead: "El escaparate digital para negocios locales de Cuautitlán Izcalli.",
    heroText:
      "Sube una foto de tu producto y crea una página lista para compartir por WhatsApp, con ayuda de IA.",
    primaryCta: "Empezar como vendedor",
    secondaryCta: "Ver el flujo",
    stats: [
      ["Ciudad piloto", "Cuautitlán Izcalli"],
      ["Primer enfoque", "Descubrimiento local"],
      ["Contacto", "Directo por WhatsApp"],
    ],
    sellersEyebrow: "Para vendedores locales",
    sellersTitle: "Tu negocio puede verse profesional sin complicarse.",
    sellersText:
      "YoComproLocal ayuda a pequeños negocios, vendedores independientes, artesanos y emprendedores de casa a publicar productos claros, bonitos y fáciles de compartir.",
    sellerBenefits: [
      "Perfil de negocio con zona, datos de contacto y productos destacados.",
      "Páginas simples para compartir cada producto por WhatsApp.",
      "Textos generados con IA para descripciones, etiquetas y mensajes de venta.",
      "Presencia profesional sin aprender diseño, marketing o herramientas complejas.",
    ],
    buyersEyebrow: "Para compradores",
    buyersTitle: "Encuentra opciones cercanas y habla directo con quien vende.",
    buyerBenefits: [
      "Descubrir productos y servicios cerca de casa.",
      "Ver información clara del vendedor antes de escribirle.",
      "Contactar directo por WhatsApp, sin pasos innecesarios.",
    ],
    product: {
      eyebrow: "Producto local",
      title: "Café artesanal",
      size: "Bolsa 250g",
      location: "Centro Urbano, Izcalli",
      description:
        "Descripción clara, etiquetas útiles y mensaje listo para compartir con clientes.",
      whatsapp: "Contactar por WhatsApp",
      whatsappHref:
        "https://wa.me/?text=Hola%2C%20me%20interesa%20este%20producto%20de%20YoComproLocal",
    },
    howEyebrow: "Cómo funciona",
    howTitle: "Tres pasos para pasar de foto suelta a página lista para vender.",
    steps: [
      {
        title: "Sube tu producto",
        text: "Foto, nombre, precio, categoría y la zona donde vendes.",
      },
      {
        title: "La IA te ayuda",
        text: "Genera descripción, etiquetas, caption corto y mensaje listo para WhatsApp.",
      },
      {
        title: "Comparte y vende",
        text: "Publica tu página y mándala a clientes, grupos locales o redes sociales.",
      },
    ],
    mvpEyebrow: "MVP disciplinado",
    mvpTitle: "Primero validamos el flujo local. Luego crecemos.",
    mvpText:
      "La primera versión debe probar si los vendedores pueden publicar, compartir y recibir contactos sin que la plataforma se meta en pagos, envíos o logística.",
    includesTitle: "Incluye al inicio",
    avoidsTitle: "Evita por ahora",
    mvpIncludes: [
      "Landing pública",
      "Registro de vendedores",
      "Dashboard de vendedor",
      "Perfil de negocio",
      "Carga de productos",
      "Imágenes de producto",
      "Páginas públicas",
      "Botón de WhatsApp",
      "Categorías básicas",
      "Aprobación admin",
      "Textos con IA",
    ],
    mvpAvoids: [
      "Pagos",
      "Envíos",
      "Reembolsos",
      "Comisiones marketplace",
      "Logística compleja",
      "Inventario avanzado",
    ],
    cityEyebrow: "Ciudad por ciudad",
    cityTitle: "Cuautitlán Izcalli es el primer laboratorio real.",
    cityText:
      "El objetivo es probar con negocios reales, escuchar sus necesidades y convertir YoComproLocal en una red local que pueda replicarse por municipio.",
    categories: ["Comida", "Artesanías", "Belleza", "Servicios", "Hogar", "Moda"],
    registerEyebrow: "Primeros vendedores",
    registerTitle:
      "Vamos a preparar la primera versión para negocios de Izcalli.",
    registerCta: "Unirme a la lista",
    registerHref: "/registro",
  },
  en: {
    pageTitle: "YoComproLocal | Buy local. Sell better.",
    languageButton: "ES",
    languageLabel: "Switch to Spanish",
    logoLabel: "YoComproLocal home",
    navLabel: "Primary navigation",
    nav: {
      sellers: "Sellers",
      how: "How it works",
      mvp: "MVP",
      city: "Izcalli",
    },
    cta: "I want to sell",
    heroAlt: "Local seller preparing products to share online",
    eyebrow: "Buy local. Sell better.",
    heroTitle: "YoComproLocal",
    heroLead:
      "The digital storefront for local businesses in Cuautitlán Izcalli.",
    heroText:
      "Upload a product photo and create a page ready to share on WhatsApp, with help from AI.",
    primaryCta: "Start as a seller",
    secondaryCta: "See the flow",
    stats: [
      ["Pilot city", "Cuautitlán Izcalli"],
      ["First focus", "Local discovery"],
      ["Contact", "Direct through WhatsApp"],
    ],
    sellersEyebrow: "For local sellers",
    sellersTitle: "Your business can look professional without the complexity.",
    sellersText:
      "YoComproLocal helps small businesses, independent sellers, artisans, and home-based entrepreneurs publish clear, attractive products that are easy to share.",
    sellerBenefits: [
      "Business profile with location zone, contact details, and featured products.",
      "Simple pages to share each product through WhatsApp.",
      "AI-generated descriptions, tags, captions, and sales messages.",
      "A professional presence without learning design, marketing, or complex tools.",
    ],
    buyersEyebrow: "For buyers",
    buyersTitle: "Find nearby options and talk directly with the seller.",
    buyerBenefits: [
      "Discover products and services close to home.",
      "See clear seller information before reaching out.",
      "Contact sellers directly through WhatsApp, without unnecessary steps.",
    ],
    product: {
      eyebrow: "Local product",
      title: "Artisan coffee",
      size: "250g bag",
      location: "Centro Urbano, Izcalli",
      description:
        "Clear description, useful tags, and a message ready to share with customers.",
      whatsapp: "Contact on WhatsApp",
      whatsappHref:
        "https://wa.me/?text=Hi%2C%20I%20am%20interested%20in%20this%20YoComproLocal%20product",
    },
    howEyebrow: "How it works",
    howTitle: "Three steps from loose photo to sales-ready product page.",
    steps: [
      {
        title: "Upload your product",
        text: "Photo, name, price, category, and the zone where you sell.",
      },
      {
        title: "AI helps you",
        text: "Generate a description, tags, short caption, and WhatsApp-ready message.",
      },
      {
        title: "Share and sell",
        text: "Publish your page and send it to customers, local groups, or social media.",
      },
    ],
    mvpEyebrow: "Disciplined MVP",
    mvpTitle: "First we validate the local flow. Then we grow.",
    mvpText:
      "The first version should prove whether sellers can publish, share, and receive contacts without the platform handling payments, shipping, or logistics.",
    includesTitle: "Included at launch",
    avoidsTitle: "Avoid for now",
    mvpIncludes: [
      "Public landing page",
      "Seller registration",
      "Seller dashboard",
      "Business profile",
      "Product upload",
      "Product images",
      "Public product pages",
      "WhatsApp button",
      "Basic categories",
      "Admin approval",
      "AI-generated copy",
    ],
    mvpAvoids: [
      "Payments",
      "Shipping",
      "Refunds",
      "Marketplace commissions",
      "Complex logistics",
      "Advanced inventory",
    ],
    cityEyebrow: "City by city",
    cityTitle: "Cuautitlán Izcalli is the first real-world test.",
    cityText:
      "The goal is to test with real businesses, listen to their needs, and turn YoComproLocal into a local network that can be replicated municipality by municipality.",
    categories: ["Food", "Crafts", "Beauty", "Services", "Home", "Fashion"],
    registerEyebrow: "First sellers",
    registerTitle:
      "We are preparing the first version for businesses in Izcalli.",
    registerCta: "Join the list",
    registerHref: "/registro",
  },
} satisfies Record<Locale, Record<string, unknown>>;

export default function Home() {
  const [locale, setLocale] = useState<Locale>("es");
  const copy = content[locale];

  useEffect(() => {
    document.documentElement.lang = locale === "es" ? "es-MX" : "en";
    document.title = copy.pageTitle as string;
  }, [copy.pageTitle, locale]);

  const toggleLocale = () => {
    const nextLocale = locale === "es" ? "en" : "es";

    setLocale(nextLocale);
  };

  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1e261f]">
      <section className="relative isolate flex min-h-[86svh] overflow-hidden text-white">
        <Image
          src="/images/yocomprolocal-hero.png"
          alt={copy.heroAlt as string}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,35,26,0.9)_0%,rgba(18,35,26,0.72)_42%,rgba(18,35,26,0.2)_100%)]" />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-3">
            <a
              href="#inicio"
              className="flex min-w-0 items-center gap-3 font-semibold"
              aria-label={copy.logoLabel as string}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-black text-[#214e34] shadow-sm">
                YCL
              </span>
              <span className="hidden text-lg tracking-wide min-[420px]:inline">
                YoComproLocal
              </span>
            </a>

            <nav
              className="hidden items-center gap-7 text-sm font-medium text-white/82 md:flex"
              aria-label={copy.navLabel as string}
            >
              <a href="#vendedores" className="transition hover:text-white">
                {copy.nav.sellers}
              </a>
              <a href="#como-funciona" className="transition hover:text-white">
                {copy.nav.how}
              </a>
              <a href="#mvp" className="transition hover:text-white">
                {copy.nav.mvp}
              </a>
              <a href="#ciudad" className="transition hover:text-white">
                {copy.nav.city}
              </a>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleLocale}
                aria-label={copy.languageLabel as string}
                className="inline-flex min-h-10 min-w-11 items-center justify-center rounded-full border border-white/40 bg-white/12 px-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                {copy.languageButton as string}
              </button>
              <a
                href="/registro"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#f6c55f] px-4 text-sm font-bold text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a] sm:px-5"
              >
                {copy.cta as string}
              </a>
            </div>
          </header>

          <div id="inicio" className="flex flex-1 items-end pb-10 pt-24 sm:pb-14">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#f6c55f]">
                {copy.eyebrow as string}
              </p>
              <h1 className="mt-5 text-[2.35rem] font-black leading-[0.96] tracking-normal min-[360px]:text-5xl sm:text-7xl lg:text-8xl">
                {copy.heroTitle as string}
              </h1>
              <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-white sm:text-2xl sm:leading-9">
                {copy.heroLead as string}
              </p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/86 sm:text-lg">
                {copy.heroText as string}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/registro"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f6c55f] px-6 text-base font-bold text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
                >
                  {copy.primaryCta as string}
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </a>
                <a
                  href="#como-funciona"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/45 bg-white/10 px-6 text-base font-bold text-white backdrop-blur transition hover:bg-white/18"
                >
                  {copy.secondaryCta as string}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dce4d6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-px bg-[#dce4d6] sm:grid-cols-3">
          {copy.stats.map(([label, value]) => (
            <div key={label} className="bg-white px-5 py-6 sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#567164]">
                {label}
              </p>
              <p className="mt-2 text-2xl font-black text-[#214e34]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="vendedores" className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
              {copy.sellersEyebrow as string}
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
              {copy.sellersTitle as string}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#53645a]">
              {copy.sellersText as string}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {copy.sellerBenefits.map((benefit) => (
              <article
                key={benefit}
                className="rounded-lg border border-[#dbe5d6] bg-white p-5 shadow-[0_10px_28px_rgba(31,52,41,0.06)]"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-lg bg-[#e6f1e8] text-sm font-black text-[#214e34]"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <p className="mt-4 text-base font-semibold leading-7 text-[#25372d]">
                  {benefit}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#173a2a] py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_0.86fr] lg:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f6c55f]">
              {copy.buyersEyebrow as string}
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">
              {copy.buyersTitle as string}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:max-w-3xl">
              {copy.buyerBenefits.map((benefit) => (
                <article
                  key={benefit}
                  className="rounded-lg border border-white/12 bg-white/7 p-5"
                >
                  <p className="text-base font-semibold leading-7 text-white/88">
                    {benefit}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/12 bg-[#f7fbf4] p-4 text-[#1e261f] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="overflow-hidden rounded-lg border border-[#dbe5d6] bg-white">
              <div className="aspect-[4/3] bg-[linear-gradient(135deg,#f6c55f_0%,#e37852_48%,#2f7c5b_100%)] p-4">
                <div className="flex h-full flex-col justify-end rounded-lg bg-black/12 p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]">
                    {copy.product.eyebrow}
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {copy.product.title}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-[#1f3429]">
                      {copy.product.size}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#6a7a70]">
                      {copy.product.location}
                    </p>
                  </div>
                  <p className="text-xl font-black text-[#c05635]">$120</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#53645a]">
                  {copy.product.description}
                </p>
                <a
                  href={copy.product.whatsappHref}
                  className="mt-5 inline-flex w-full min-h-11 items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
                >
                  {copy.product.whatsapp}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2f7c5b]">
              {copy.howEyebrow as string}
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
              {copy.howTitle as string}
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] p-6"
              >
                <p className="text-sm font-black text-[#c05635]">
                  0{index + 1}
                </p>
                <h3 className="mt-5 text-2xl font-black text-[#1f3429]">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-[#53645a]">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="mvp"
        className="border-y border-[#dce4d6] bg-[#eef5ec] py-16 sm:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
              {copy.mvpEyebrow as string}
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
              {copy.mvpTitle as string}
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#53645a]">
              {copy.mvpText as string}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-lg border border-[#cddcc9] bg-white p-6">
              <h3 className="text-xl font-black text-[#214e34]">
                {copy.includesTitle as string}
              </h3>
              <ul className="mt-5 grid gap-3 text-sm font-semibold leading-6 text-[#3f5147]">
                {copy.mvpIncludes.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[#2f7c5b]" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-lg border border-[#e5d0c7] bg-white p-6">
              <h3 className="text-xl font-black text-[#c05635]">
                {copy.avoidsTitle as string}
              </h3>
              <ul className="mt-5 grid gap-3 text-sm font-semibold leading-6 text-[#5d4a43]">
                {copy.mvpAvoids.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[#c05635]" aria-hidden="true">
                      ×
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="ciudad" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#2f7c5b]">
                {copy.cityEyebrow as string}
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-[#1f3429] sm:text-5xl">
                {copy.cityTitle as string}
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#53645a]">
                {copy.cityText as string}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {copy.categories.map((category) => (
                <div
                  key={category}
                  className="rounded-lg border border-[#dbe5d6] bg-[#fbfbf7] px-5 py-6"
                >
                  <p className="text-lg font-black text-[#1f3429]">{category}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="registro" className="bg-[#f6c55f] py-14 text-[#1c261f]">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7a3a25]">
              {copy.registerEyebrow as string}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              {copy.registerTitle as string}
            </h2>
          </div>
          <a
            href={copy.registerHref as string}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#173a2a] px-6 text-base font-black text-white transition hover:bg-[#214e34]"
          >
            {copy.registerCta as string}
          </a>
        </div>
      </section>
    </main>
  );
}
