import { FriendlyMissingState } from "@/components/friendly-missing-state";

export default function SellerPanelNotFound() {
  return (
    <FriendlyMissingState
      eyebrow="Panel no encontrado"
      title="No encontramos este panel."
      body="Puede que hayas entrado con otro correo o que el enlace del negocio haya cambiado. Pide un nuevo enlace de acceso y usa el correo con el que registraste tu negocio."
      helper="El acceso depende del correo, no del WhatsApp. Esto nos ayuda a proteger tu panel."
      actions={[
        { href: "/entrar", label: "Pedir enlace de acceso" },
        { href: "/vender", label: "Registrar negocio", variant: "secondary" },
      ]}
    />
  );
}
