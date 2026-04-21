import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ClubCreateForm } from "@/components/admin/ClubCreateForm";
import { Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewClubPage() {
    const session = await auth();
    if (!session || !["SUPERADMIN", "FEDERATION_ADMIN"].includes((session.user as any).role)) {
        redirect("/dashboard");
    }

    return (
        <main className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-sans">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header Táctico */}
                <header className="flex flex-col gap-4 border-b border-slate-800 pb-6">
                    <Link 
                        href="/admin/clubes" 
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Volver a Gestión de Clubes
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-indigo-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Alta de Sede Federada</h1>
                            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Procedimiento de Ingreso al Padrón Nacional</p>
                        </div>
                    </div>
                </header>

                {/* Formulario de Carga */}
                <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />
                    <ClubCreateForm />
                </section>

                <footer className="text-center">
                    <p className="text-[10px] text-slate-700 font-medium uppercase tracking-[0.2em]">
                        SGF · Sistema General de Federación · Seguridad Nivel 4
                    </p>
                </footer>
            </div>
        </main>
    );
}
