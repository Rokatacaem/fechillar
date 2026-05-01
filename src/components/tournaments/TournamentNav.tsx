"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutGrid, Trophy, ListOrdered, Settings, GitBranch, LayoutDashboard } from "lucide-react";

export function TournamentNav({ id }: { id: string }) {
    const pathname = usePathname();

    const tabs = [
        { name: "Gestión", href: `/tournaments/${id}/gestion`, icon: LayoutDashboard },
        { name: "Inscripciones", href: `/tournaments/${id}/inscripciones`, icon: Users },
        { name: "Grupos", href: `/tournaments/${id}/grupos`, icon: LayoutGrid },
        { name: "Resultados", href: `/tournaments/${id}/resultados`, icon: ListOrdered },
        { name: "Cuadros", href: `/tournaments/${id}/cuadros`, icon: Trophy },
        { name: "Llaves", href: `/tournaments/${id}/bracket`, icon: GitBranch },
        { name: "Config", href: `/tournaments/${id}/editar`, icon: Settings },
    ];

    return (
        <nav className="flex items-center gap-1 bg-slate-900/50 border border-white/5 p-1 rounded-2xl mb-8 max-w-fit">
            {tabs.map((tab) => {
                const isActive = pathname.includes(tab.href);
                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isActive
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        }`}
                    >
                        <tab.icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-600"}`} />
                        {tab.name}
                    </Link>
                );
            })}
        </nav>
    );
}
