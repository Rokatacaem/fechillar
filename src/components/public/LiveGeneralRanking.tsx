"use client";

import React from "react";
import { ListOrdered, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Standing {
    playerId: string;
    playerName: string;
    clubName: string;
    points: number;
    average: number;
    highRun: number;
}

export function LiveGeneralRanking({ standings }: { standings: Standing[] }) {
    // Definir zonas
    // 1-28: Clasificados Directos (Verde)
    // 29-36: Zona de Barrage (Naranja)
    // 37+: Eliminados (Gris/Rojo)

    return (
        <div className="max-w-6xl mx-auto p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-500/10 rounded-2xl">
                        <ListOrdered className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Ranking General</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Clasificación Global del Torneo</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Top 28: Directo</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">29-36: Barrage</span>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-hidden bg-slate-900/40 border border-white/5 rounded-[2.5rem] backdrop-blur-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                    {/* Primera Columna (1-27) */}
                    <RankingColumn players={standings.slice(0, 27)} startRank={1} />
                    
                    {/* Segunda Columna (28-54) en Escritorio */}
                    <div className="hidden md:block h-full">
                        <RankingColumn players={standings.slice(27, 54)} startRank={28} />
                    </div>
                    
                    {/* En móviles, mostramos el resto de la lista debajo de la primera */}
                    <div className="md:hidden">
                         <RankingColumn players={standings.slice(27, 54)} startRank={28} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function RankingColumn({ players, startRank }: { players: Standing[], startRank: number }) {
    return (
        <div className="flex flex-col divide-y divide-white/5 h-full">
            <div className="grid grid-cols-12 gap-2 px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5">
                <div className="col-span-1">#</div>
                <div className="col-span-6">Atleta / Club</div>
                <div className="col-span-1 text-center">PTS</div>
                <div className="col-span-2 text-center">AVG</div>
                <div className="col-span-2 text-center">HR</div>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar">
                {players.map((p, i) => {
                    const rank = startRank + i;
                    let zoneColor = "text-slate-400";
                    let bgColor = "hover:bg-white/[0.02]";
                    
                    if (rank <= 28) {
                        zoneColor = "text-emerald-400";
                        // bgColor = "bg-emerald-500/[0.02]";
                    } else if (rank <= 36) {
                        zoneColor = "text-amber-500";
                        bgColor = "bg-amber-500/[0.05] hover:bg-amber-500/[0.1]";
                    }

                    return (
                        <div key={p.playerId} className={`grid grid-cols-12 items-center gap-2 px-6 py-2 transition-all ${bgColor}`}>
                            <div className={`col-span-1 text-xs font-black ${zoneColor}`}>
                                {rank}
                            </div>
                            <div className="col-span-6 min-w-0">
                                <p className="text-[11px] font-black text-white truncate uppercase tracking-tight">
                                    {p.playerName}
                                </p>
                                <p className="text-[8px] text-slate-600 font-bold uppercase truncate">
                                    {p.clubName}
                                </p>
                            </div>
                            <div className="col-span-1 text-center text-xs font-black text-white tabular-nums">
                                {p.points}
                            </div>
                            <div className="col-span-2 text-center text-[10px] font-bold text-slate-400 tabular-nums">
                                {p.average.toFixed(3)}
                            </div>
                            <div className="col-span-2 text-center text-[10px] font-black text-violet-400 tabular-nums">
                                {p.highRun}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
