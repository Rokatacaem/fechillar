import React from "react";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PlayerForm } from "@/components/players/PlayerForm";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewPlayerPage() {
    const session = await auth();
    
    // Solo Federativos y SuperAdmins pueden registrar directamente en el Padrón Nacional
    if (!session?.user?.id || !["SUPERADMIN", "FEDERATION_ADMIN"].includes((session?.user as any)?.role)) {
        redirect("/federacion/padron");
    }

    // Obtener lista de clubes para la vinculación inicial
    const clubs = await prisma.club.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true }
    });

    return (
        <main className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Navegación y Header */}
                <div className="flex flex-col gap-4">
                    <Link 
                        href="/federacion/padron" 
                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-emerald-500/30 transition-all">
                            <ArrowLeft className="w-3 h-3" />
                        </div>
                        Volver al Padrón Nacional
                    </Link>

                    <div className="space-y-1">
                        <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-4 uppercase">
                            <Users className="w-12 h-12 text-emerald-500" />
                            Alta de <span className="text-emerald-500">Deportista</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                            Procedimiento de Incorporación al Padrón Federado Nacional
                        </p>
                    </div>
                </div>

                {/* Formulario de Alta */}
                <div className="mt-10">
                    <PlayerForm clubs={clubs} />
                </div>

                {/* Footer de Seguridad */}
                <div className="pt-10 border-t border-white/5 flex justify-center">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                        SGF - Sistema General de Federacion - Seguridad Nivel 4
                    </p>
                </div>
            </div>
        </main>
    );
}
