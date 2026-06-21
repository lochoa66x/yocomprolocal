"use client";

import { useMemo, useState } from "react";

type Props = {
  sellerSlug: string;
};

export function RegistrationSuccessActions({ sellerSlug }: Props) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const sellerPath = `/vendedor/${sellerSlug}`;
  const productPath = `/producto/nuevo?seller=${encodeURIComponent(
    sellerSlug
  )}`;
  const storeUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return sellerPath;
    }

    return new URL(sellerPath, window.location.origin).toString();
  }, [sellerPath]);

  async function copyStoreLink() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="mt-7 grid gap-3">
      <a
        href={sellerPath}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#214e34]/20 bg-white px-5 text-sm font-black text-[#214e34] transition hover:border-[#214e34]/35 hover:bg-[#eef5ec]"
      >
        Ver mi perfil
      </a>
      <a
        href={productPath}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#f6c55f] px-5 text-sm font-black text-[#1c261f] shadow-sm transition hover:bg-[#ffd77a]"
      >
        Agregar mi primer producto
      </a>
      <button
        type="button"
        onClick={copyStoreLink}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#25d366] px-5 text-sm font-black text-[#102318] transition hover:bg-[#39df78]"
      >
        {copyState === "copied"
          ? "Enlace copiado"
          : "Copiar enlace de mi tienda"}
      </button>
      {copyState === "error" && (
        <p className="rounded-lg bg-[#eef5ec] p-3 text-sm font-semibold leading-6 text-[#53645a]">
          No se pudo copiar automáticamente. Abre tu perfil y copia el enlace
          desde el navegador.
        </p>
      )}
    </div>
  );
}
