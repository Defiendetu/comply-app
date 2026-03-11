import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comply - Cumplimiento SAGRILAFT Automatizado",
  description: "Genera tu Manual de Medidas Mínimas y Matriz de Riesgo LA/FT/FPADM en minutos. Cumplimiento con la Superintendencia de Sociedades simplificado.",
  keywords: ["SAGRILAFT", "LA/FT/FPADM", "cumplimiento", "Superintendencia de Sociedades", "medidas mínimas", "matriz de riesgo"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
