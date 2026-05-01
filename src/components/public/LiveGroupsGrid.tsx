"use client";

import React from "react";
import { Trophy, Activity, Target, Zap } from "lucide-react";
import { TournamentQR } from "./TournamentQR";

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
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
            {groups.map((group) => (
                <div 
                    key={group.id} 
                    className="bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-3xl overflow-hidden shadow-2xl transition-all hover:border-emerald-500/20"
                >
                    {/* Group Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">
                            {group.name}
                        </h3>
                        <Trophy className="w-4 h-4 text-[var(--color-accent)]" />
                    </div>

                    {/* Standings Table */}
                    <div className="p-2">
                        <table className="w-full text-left">
                            <thead className="text-[9px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                                <tr>
                                    <th className="px-3 py-2">#</th>
                                    <th className="py-2">Jugador</th>
                                    <th className="pr-3 py-2 text-right">PTS</th>
                                    <th className="pr-3 py-2 text-right">AVG</th>
                                    <th className="pr-3 py-2 text-right text-emerald-500">HR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {group.standings.map((player, idx) => (
                                    <tr 
                                        key={player.playerId} 
                                        className={`transition-colors hover:bg-white/[0.02] ${idx < 2 ? 'bg-emerald-500/[0.03]' : ''}`}
                                    >
                                        <td className="px-3 py-3">
                                            <span className={`text-[10px] font-black ${idx < 2 ? 'text-[var(--color-accent)]' : 'text-slate-700'}`}>
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[9px] font-black text-white shrink-0 overflow-hidden">
                                                    {player.playerPhoto ? (
                                                        <img src={player.playerPhoto} alt={player.playerName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        player.playerName.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-white truncate max-w-[80px]">
                                                        {player.playerName.split(' ')[0]}
                                                    </p>
                                                    <p className="text-[8px] text-slate-600 uppercase font-black truncate max-w-[80px]">
                                                        {player.clubName}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="pr-3 py-3 text-right">
                                            <span className="text-xs font-black text-white">{player.points}</span>
                                        </td>
                                        <td className="pr-3 py-3 text-right">
                                            <span className="text-[10px] font-mono font-bold text-slate-400">
                                                {player.average.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="pr-3 py-3 text-right">
                                            <span className="text-[10px] font-mono font-black text-[var(--color-accent)]">
                                                {player.highRun}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Clasificación Footer */}
                    <div className="p-3 bg-black/20 border-t border-white/5 flex justify-between items-center">
                        <div className="flex gap-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">
                            Clasifican Primeros 2
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function LiveStandingsHeader({ 
    title, 
    lastUpdate, 
    clubLogo,
    tournamentId 
}: { 
    title: string, 
    lastUpdate?: string, 
    clubLogo?: string | null,
    tournamentId?: string
}) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 gap-6 relative z-50">
            <div className="flex items-center gap-6">
                {/* Dual Branding: Logo Federación (Static) + Logo Club (Dynamic) */}
                <div className="flex items-center -space-x-3">
                    <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-xl border border-white/10 z-10">
                        <img src="/logo-fed.png" alt="Federación" className="w-full h-full object-contain" />
                    </div>
                    {clubLogo && (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 p-2 shadow-xl border border-white/5 rotate-6">
                            <img src={clubLogo} alt="Club" className="w-full h-full object-contain" />
                        </div>
                    )}
                </div>

                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                        Ranking <span className="text-[var(--color-accent)] underline decoration-4 underline-offset-8">Grupos</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em] mt-3">
                        {title} • MODO COMPETICIÓN
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="hidden lg:block">
                    {tournamentId && (
                        <TournamentQR 
                            tournamentId={tournamentId} 
                            tournamentName={title} 
                            showLabel={false}
                            size={70} 
                        />
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
