"use client";

import React from "react";
import { Trophy, Activity } from "lucide-react";
import { TournamentQR } from "../tournaments/TournamentQR";

interface Standing {
    playerId: string;
    playerName: string;
    playerPhoto: string | null;
    clubName: string;
    played: number;
    won: number;
    points: number;
    average: number;
    highRun: number;
}

interface Group {
    id: string;
    name: string;
    standings: Standing[];
}

export function LiveGroupsGrid({ groups }: { groups: Group[] }) {
    const [page, setPage] = React.useState(0);
    const PAGE_SIZE = 9;
    const totalPages = Math.ceil(groups.length / PAGE_SIZE);

    React.useEffect(() => {
        if (totalPages <= 1) return;
        const t = setInterval(() => setPage(p => (p + 1) % totalPages), 8000);
        return () => clearInterval(t);
    }, [totalPages]);

    const visible = groups.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    return (
        <div className="flex flex-col gap-2 px-2">
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {visible.map((group) => (
                    <div
                        key={group.id}
                        className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-xl"
                    >
                        {/* Group Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-3 py-2 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-white font-black text-[10px] uppercase tracking-widest truncate">
                                {group.name}
                            </h3>
                            <Trophy className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
                        </div>

                        {/* Standings */}
                        <div className="divide-y divide-white/5">
                            {group.standings.map((player, idx) => (
                                <div
                                    key={player.playerId}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 ${idx < 2 ? 'bg-emerald-500/[0.04]' : ''}`}
                                >
                                    <span className={`text-[9px] font-black w-3 shrink-0 ${idx < 2 ? 'text-[var(--color-accent)]' : 'text-slate-700'}`}>
                                        {idx + 1}
                                    </span>
                                    <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[8px] font-black text-white shrink-0 overflow-hidden">
                                        {player.playerPhoto
                                            ? <img src={player.playerPhoto} alt="" className="w-full h-full object-cover" />
                                            : player.playerName.charAt(0)
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-white truncate leading-tight">
                                            {player.playerName.split(' ')[0]}
                                        </p>
                                        <p className="text-[7px] text-slate-600 uppercase font-bold truncate leading-tight">
                                            {player.clubName}
                                        </p>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0 text-right">
                                        <span className="text-[10px] font-black text-white w-4">{player.points}</span>
                                        <span className="text-[9px] font-mono text-slate-500 w-8">{player.average.toFixed(2)}</span>
                                        <span className="text-[9px] font-black text-[var(--color-accent)] w-4">{player.highRun}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-2 py-1 bg-black/20 border-t border-white/5 flex justify-end">
                            <p className="text-[7px] text-slate-700 uppercase font-bold tracking-tight">Clasif. 2</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Page indicator */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-1.5 py-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Página ${i + 1}`}
                            onClick={() => setPage(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === page ? 'bg-emerald-500 w-4' : 'bg-slate-700'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function LiveStandingsHeader({
    title,
    lastUpdate,
    clubLogo,
    tournamentId
}: {
    title: string;
    lastUpdate?: string;
    clubLogo?: string | null;
    tournamentId?: string;
}) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 gap-6 relative z-50">
            <div className="flex items-center gap-5">
                {/* Fechillar logo — left */}
                <div className="w-16 h-16 rounded-2xl bg-slate-900 p-1.5 shadow-xl border border-white/10 overflow-hidden shrink-0">
                    <img src="/fechillar_logo_final_v5.jpg" alt="Fechillar" className="w-full h-full object-contain rounded-xl" />
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                        Ranking <span className="text-[var(--color-accent)] underline decoration-4 underline-offset-8">Grupos</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em] mt-3">
                        {title} • MODO COMPETICIÓN
                    </p>
                </div>

                {/* Club logo — right of title */}
                {clubLogo && (
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 p-2 shadow-xl border border-white/10 overflow-hidden shrink-0">
                        <img src={clubLogo} alt="Club" className="w-full h-full object-contain" />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden lg:flex flex-col items-center gap-1">
                    {tournamentId && (
                        <>
                            <TournamentQR
                                tournamentId={tournamentId}
                                tournamentName={title}
                                showLabel={false}
                                size={70}
                            />
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Seguir en vivo</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 border border-white/5 p-4 py-3 rounded-2xl">
                    <div className="relative">
                        <Activity className="w-5 h-5 text-[var(--color-accent)]" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-[var(--color-accent)] rounded-full animate-ping" />
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Live Status</p>
                        <p className="text-xs font-black text-white uppercase tracking-tighter">Sincronizado {lastUpdate}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
