"use client";

import { usePathname } from "next/navigation";
import { FriendlyMissingState } from "@/components/friendly-missing-state";

function getSellerHref(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const sellerSlug = parts[0] === "vendedor" ? parts[1] : "";

  return sellerSlug ? `/vendedor/${sellerSlug}` : "/vendedores";
}

export default function ProductNotFound() {
  const pathname = usePathname();
  const sellerHref = getSellerHref(pathname ?? "");

  return (
    <FriendlyMissingState
      eyebrow="Producto no encontrado"
      title="No encontramos este producto."
      body="Puede que el producto se haya agotado, esté en borrador o el negocio haya cambiado el enlace. Aun así puedes volver a la tienda o seguir viendo más productos locales."
      helper="En YoComproLocal compras directo con el vendedor, sin carrito ni checkout."
      actions={[
        { href: sellerHref, label: "Volver a la tienda" },
        { href: "/productos", label: "Ver catálogo", variant: "secondary" },
      ]}
    />
  );
}
