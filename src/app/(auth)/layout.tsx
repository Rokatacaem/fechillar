import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Iniciar Sesión | Fechillar",
    description: "Accede al portal oficial de la Federación Chilena de Billar.",
};

/**
 * Layout exclusivo para rutas de autenticación (/login, /register, etc.).
 *
 * AISLAMIENTO TOTAL:
 * - Sin SgfSidebar, sin SgfHeader, sin chrome de la app interna.
 * - Sin importación de globals.css (lo hereda del RootLayout raíz via src/app/layout.tsx).
 * - Renderiza solo el children del Page, sobre el html/body del RootLayout.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
