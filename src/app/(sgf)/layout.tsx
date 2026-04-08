import type { Metadata } from "next";

import { SgfSidebar } from "@/components/layout/SgfSidebar";
import { SgfHeader } from "@/components/layout/SgfHeader";
import "@/app/(public)/globals.css"; // Ruta absoluta con @ es más segura



export const metadata: Metadata = {
    title: "SGF | Fechillar - Gestión de Federaciones",
    description: "Sistema de Gestión de Federaciones de Billar",
};

export default function SgfLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="dark min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
            <div className="flex min-h-screen">
                {/* Sidebar - Asegúrate de que este componente no tenga errores internos */}
                <SgfSidebar />

                <div className="flex-1 ml-64 flex flex-col">
                    {/* Header - Aquí es donde VS Code marca el error principal */}
                    <SgfHeader />

                    <main className="flex-1 p-8 pt-24">
                        <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {/* Luces de fondo (Gradients) */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none z-[-1]" />
            <div className="fixed bottom-0 left-64 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none z-[-1]" />
        </div>
    );
}