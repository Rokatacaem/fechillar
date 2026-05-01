import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TournamentForm } from "./TournamentForm";

export default async function NewTournamentPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const role = (session?.user as any)?.role || "USER";
    const canCreateNational = ["FEDERATION_DELEGATE", "FEDERATION_ADMIN", "SUPERADMIN"].includes(role);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
            {/* Header / Nav */}
            <div className="flex flex-col gap-4">
                <Link href="/tournaments" className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-xl w-fit">
                    <ArrowLeft className="w-4 h-4" />
                    Listado de Torneos
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                        CREAR <span className="text-emerald-500">TORNEO</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
                        Define los parámetros de la nueva competencia
                    </p>
                </div>
            </div>

            {/* Formulario Reactivo */}
            <TournamentForm canCreateNational={canCreateNational} />
        </div>
    );
}
