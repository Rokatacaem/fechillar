import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Fechillar - Federación Chilena de Billar",
  description: "Plataforma oficial de la Federación Chilena de Billar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-slate-50`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
