import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yocomprolocal.com.mx"),
  title: "YoComproLocal | Compra local. Vende mejor.",
  description:
    "Escaparate digital para negocios locales de Cuautitlán Izcalli con ayuda de IA y contacto directo por WhatsApp.",
  openGraph: {
    title: "YoComproLocal",
    description:
      "El escaparate digital para negocios locales de Cuautitlán Izcalli.",
    images: ["/images/yocomprolocal-hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
