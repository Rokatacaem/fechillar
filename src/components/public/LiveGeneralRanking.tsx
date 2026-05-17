"use client";

import React from "react";
import { ListOrdered, AlertTriangle, CheckCircle2, Crosshair } from "lucide-react";

interface Standing {
    playerId: string;
    playerName: string;
    clubName: string;
    points: number;
    average: number;
    highRun: number;
    carambolas?: number;
    innings?: number;
}

export function LiveGeneralRanking({
    standings,
    classifyCount = 8,
    totalCarambolas,
}: {
    standings: Standing[];
    classifyCount?: number;
    totalCarambolas?: number;
}) {
    return (
        <div className="max-w-6xl mx-auto px-4 pt-2 pb-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-xl">
                        <ListOrdered className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Ranking General</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Clasificación Global del Torneo</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {totalCarambolas !== undefined && totalCarambolas > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 rounded-xl border border-violet-500/20">
                            <Crosshair className="w-3 h-3 text-violet-400" />
                            <span className="text-[9px] font-black text-violet-300 uppercase tracking-widest">
                                Total: {totalCarambolas.toLocaleString("es-CL")} carambolas
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Top {classifyCount}: Clasificados</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Eliminados</span>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-hidden bg-slate-900/40 border border-white/5 rounded-[2.5rem] backdrop-blur-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                    <RankingColumn players={standings.slice(0, 27)} startRank={1} classifyCount={classifyCount} />
                    <div className="hidden md:block h-full">
                        <RankingColumn players={standings.slice(27, 54)} startRank={28} classifyCount={classifyCount} />
                    </div>
                    <div className="md:hidden">
                        <RankingColumn players={standings.slice(27, 54)} startRank={28} classifyCount={classifyCount} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function RankingColumn({ players, startRank, classifyCount }: { players: Standing[]; startRank: number; classifyCount: number }) {
    return (
        <div className="flex flex-col divide-y divide-white/5 h-full">
            {/* Cabecera */}
            <div className="grid grid-cols-12 gap-1 px-4 py-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Atleta / Club</div>
                <div className="col-span-1 text-center">PTS</div>
                <div className="col-span-2 text-center">CAR</div>
                <div className="col-span-2 text-center">AVG</div>
                <div className="col-span-2 text-center">HR</div>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar">
                {players.map((p, i) => {
                    const rank = startRank + i;
                    const zoneColor = rank <= classifyCount ? "text-emerald-400" : "text-slate-400";
                    const bgColor = rank <= classifyCount
                        ? "hover:bg-emerald-500/[0.03]"
                        : "hover:bg-white/[0.02]";

                    return (
                        <div key={p.playerId} className={`grid grid-cols-12 items-center gap-1 px-4 py-[3px] transition-all ${bgColor}`}>
                            {/* # */}
                            <div className={`col-span-1 text-[10px] font-black ${zoneColor}`}>
                                {rank}
                            </div>

                            {/* Nombre / Club */}
                            <div className="col-span-4 min-w-0">
                                <p className="text-[10px] font-black text-white truncate uppercase tracking-tight leading-tight">
                                    {p.playerName}
                                </p>
                                <p className="text-[7px] text-slate-600 font-bold uppercase truncate leading-tight">
                                    {p.clubName}
                                </p>
                            </div>

                            {/* PTS */}
                            <div className="col-span-1 text-center text-[10px] font-black text-white tabular-nums">
                                {p.points}
                            </div>

                            {/* Carambolas */}
                            <div className="col-span-2 text-center text-[9px] font-black text-amber-400 tabular-nums">
                                {p.carambolas ?? "-"}
                            </div>

                            {/* AVG */}
                            <div className="col-span-2 text-center text-[9px] font-bold text-slate-400 tabular-nums">
                                {p.average.toFixed(3)}
                            </div>

                            {/* HR */}
                            <div className="col-span-2 text-center text-[9px] font-black text-violet-400 tabular-nums">
                                {p.highRun}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
