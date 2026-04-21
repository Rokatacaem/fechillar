"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function CensusSearch({ clubs }: { clubs: { id: string, name: string }[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) params.set("q", term);
        else params.delete("q");
        
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    const handleClubFilter = (clubId: string) => {
        const params = new URLSearchParams(searchParams);
        if (clubId) params.set("club", clubId);
        else params.delete("club");
        
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                    type="text"
                    defaultValue={searchParams.get("q")?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Buscar por nombre, RUT o email..."
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                />
                {searchParams.get("q") && (
                    <button 
                        onClick={() => handleSearch("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <select 
                defaultValue={searchParams.get("club")?.toString()}
                onChange={(e) => handleClubFilter(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all text-sm md:min-w-[240px] appearance-none"
            >
                <option value="">Todos los Clubes</option>
                {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                ))}
            </select>

            <button className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/5 flex items-center justify-center gap-2">
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                    <Search className="w-4 h-4" />
                )}
                Buscar
            </button>
        </div>
    );
}
