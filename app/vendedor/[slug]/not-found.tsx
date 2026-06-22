import { FriendlyMissingState } from "@/components/friendly-missing-state";

export default function SellerNotFound() {
  return (
    <FriendlyMissingState
      eyebrow="Tienda no encontrada"
      title="No encontramos esta tienda."
      body="Tal vez el negocio cambió su enlace, todavía está preparando su perfil o ya no está publicado. Puedes revisar otros negocios locales de Izcalli."
      helper="Si este es tu negocio, entra a tu panel con el mismo correo que usaste al registrarte."
      actions={[
        { href: "/vendedores", label: "Ver vendedores" },
        { href: "/entrar", label: "Entrar a mi panel", variant: "secondary" },
      ]}
    />
  );
}
