type MissingStateAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type FriendlyMissingStateProps = {
  actions: MissingStateAction[];
  body: string;
  eyebrow?: string;
  helper?: string;
  title: string;
};

export function FriendlyMissingState({
  actions,
  body,
  eyebrow = "Algo no apareció",
  helper,
  title,
}: FriendlyMissingStateProps) {
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
            href="/productos"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/35 px-4 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Ver productos
          </a>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="rounded-lg bg-[#173a2a] p-7 text-white shadow-[0_18px_45px_rgba(31,52,41,0.14)] sm:p-9">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#f6c55f]">
              YCL
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Vamos a encontrar otra buena opción.
            </h2>
            <p className="mt-5 text-base font-semibold leading-7 text-white/78">
              En YoComproLocal los productos cambian rápido: algunos se agotan,
              otros vuelven después y otros negocios apenas están subiendo su
              catálogo.
            </p>
          </div>

          <div className="rounded-lg border border-[#dbe5d6] bg-white p-7 shadow-[0_14px_36px_rgba(31,52,41,0.08)] sm:p-9">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c05635]">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-[#1f3429] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53645a]">{body}</p>
            {helper && (
              <p className="mt-4 rounded-lg bg-[#eef5ec] p-4 text-sm font-semibold leading-6 text-[#214e34]">
                {helper}
              </p>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {actions.map((action) => {
                const isPrimary = action.variant !== "secondary";

                return (
                  <a
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={
                      isPrimary
                        ? "inline-flex min-h-12 items-center justify-center rounded-full bg-[#25d366] px-5 text-center text-base font-black leading-5 text-[#102318] transition hover:bg-[#39df78]"
                        : "inline-flex min-h-12 items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-center text-base font-black leading-5 text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
                    }
                  >
                    {action.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
