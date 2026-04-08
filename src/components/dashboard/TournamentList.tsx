import React from "react";
import { Trophy, Calendar, MapPin, ChevronRight, User } from "lucide-react";
import Link from "next/link";

interface TournamentListProps {
  tournaments: {
    id: string;
    name: string;
    startDate: Date;
    location: string | null;
    discipline: string;
    category: string;
  }[];
}

export function TournamentList({ tournaments }: TournamentListProps) {
  return (
    <div className="flex flex-col space-y-4 rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl h-full shadow-xl">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
          Próximos Torneos <span className="text-emerald-500/40 text-[10px] ml-1 tracking-tighter">(Federativos)</span>
        </h2>
        <Link href="/sgf/tournaments" className="p-1 px-2 text-[10px] font-bold text-emerald-500 border border-emerald-500/20 rounded-md hover:bg-emerald-500/10 transition-colors uppercase tracking-widest">
          Gestionar Calendario
        </Link>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {tournaments.length > 0 ? (
          tournaments.map((tournament) => (
            <div key={tournament.id} className="group relative rounded-2xl bg-slate-950 border border-white/5 p-5 transition-all hover:bg-slate-900 hover:border-emerald-500/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-slate-950 shadow-lg group-hover:scale-105 transition-transform">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <h3 className="text-base font-extrabold text-white tracking-tight">{tournament.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5 uppercase font-bold text-emerald-500/80 tracking-widest">
                        <User className="h-3 w-3" />
                        <span>{tournament.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        <span>{tournament.location || "Por definir"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 border border-white/5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-tighter">
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Info Badge - Minimalist */}
              <div className="absolute top-2 right-2 flex gap-2">
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border border-white/5">
                  {tournament.discipline.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-4 opacity-30 py-10">
            <Trophy className="h-12 w-12 text-slate-600" />
            <p className="text-xs text-slate-500 font-extrabold uppercase tracking-widest text-center">No hay torneos programados</p>
          </div>
        )}
      </div>

      {/* Decorative billiard ball icon/element? Just minimalist indicator for now */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 opacity-20">
         <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
         <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
         <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
      </div>
    </div>
  );
}
