import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo Musical",
  description: "Marca las canciones que escuches y sé el primero en cantar Bingo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
