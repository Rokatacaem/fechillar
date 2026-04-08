import type { Metadata } from "next";


import "./globals.css";

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
      <div className="antialiased bg-slate-50 min-h-screen">
        {children}
      </div>
    );
}
