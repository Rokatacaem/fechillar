import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/src/lib/utils";
import "@/src/app/(public)/globals.css";
import { NextAuthProvider } from "@/src/components/providers/NextAuthProvider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Fechillar - Portal de Billar Chileno",
  description: "Plataforma oficial de la Federación Chilena de Billar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(inter.variable, "antialiased font-sans")}
        suppressHydrationWarning
      >
        <NextAuthProvider>
          {children}
          <Toaster theme="dark" position="top-right" richColors closeButton />
        </NextAuthProvider>
      </body>
    </html>
  );
}
