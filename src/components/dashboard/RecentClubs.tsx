import React from "react";
import { PlusCircle, Building2, MapPin } from "lucide-react";
import Link from "next/link";

interface RecentClubsProps {
  clubs: {
    id: string;
    name: string;
    city: string | null;
    createdAt: Date;
  }[];
}

export function RecentClubs({ clubs }: RecentClubsProps) {
  return (
    <div className="flex flex-col space-y-4 rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl h-full shadow-xl">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
          Actividad Reciente <span className="text-emerald-500/40 text-[10px] ml-1 tracking-tighter">(Últimos 5 Clubes)</span>
        </h2>
        <Link href="/sgf/clubs" className="p-1 px-2 text-[10px] font-bold text-emerald-500 border border-emerald-500/20 rounded-md hover:bg-emerald-500/10 transition-colors uppercase tracking-widest">
          Ver Todo
        </Link>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {clubs.length > 0 ? (
          clubs.map((club) => (
            <div key={club.id} className="group flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-transparent hover:border-emerald-500/20 hover:bg-slate-800 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 border border-white/5 text-emerald-500 group-hover:scale-105 transition-transform">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-bold text-white tracking-tight">{club.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                    <MapPin className="h-2.5 w-2.5" />
                    <span>{club.city || "Ciudad no especificada"}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                  {new Date(club.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-1 flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-extrabold text-emerald-500 uppercase">Validados</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-3 opacity-40">
            <PlusCircle className="h-10 w-10 text-slate-600" />
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest text-center">Sin clubes registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
