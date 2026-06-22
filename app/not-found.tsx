import { FriendlyMissingState } from "@/components/friendly-missing-state";

export default function NotFound() {
  return (
    <FriendlyMissingState
      eyebrow="Página no encontrada"
      title="Esta página no está por aquí."
      body="Puede que el enlace haya cambiado o que esa sección todavía no exista. Puedes seguir explorando productos y negocios locales."
      actions={[
        { href: "/productos", label: "Ver productos" },
        { href: "/vendedores", label: "Ver vendedores", variant: "secondary" },
      ]}
    />
  );
}
