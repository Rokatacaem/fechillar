import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { BasesTorneoForm } from "./BasesTorneoForm";

export default async function BasesTorneoPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-700 pb-20">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter flex items-center gap-3">
                        <FileText className="w-8 h-8 text-violet-400" />
                        GENERADOR DE <span className="text-violet-400">BASES</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                        Crear documento Word de bases de torneo · Fechillar
                    </p>
                </div>
            </div>

            <BasesTorneoForm />
        </div>
    );
}
