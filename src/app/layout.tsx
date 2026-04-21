import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/app/(public)/globals.css";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { Toaster } from "sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="es" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body
        className={`${inter.variable} antialiased`}
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
