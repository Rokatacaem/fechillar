"use client";

import React from "react";
import { Swords, Radio } from "lucide-react";

interface Player {
    id: string;
    user: { name: string };
}

interface Match {
    id: string;
    round: number;
    matchOrder: number;
    homePlayer: Player | null;
    awayPlayer: Player | null;
    homePlayerId?: string | null;
    awayPlayerId?: string | null;
    homeScore: number | null;
    awayScore: number | null;
    winnerId: string | null;
    tableNumber: string | null;
}

export function LiveBrackets({ matches }: { matches: Match[] }) {
    // Agrupar por rondas
    const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
    const matchesByRound = rounds.map(r => matches.filter(m => m.round === r));

    return (
        <div className="flex gap-12 overflow-x-auto p-8 items-start scrollbar-hide select-none transition-all duration-1000">
            {matchesByRound.map((roundMatches, roundIndex) => (
                <div key={`round-${roundIndex}`} className="flex flex-col gap-8 min-w-[280px] shrink-0 justify-around">
                    <div className="sticky top-0 z-10 bg-slate-950/40 backdrop-blur-3xl pb-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-white/5 pb-2">
                            {roundIndex === rounds.length - 1 ? 'Gran Final' : `Ronda ${rounds[roundIndex]}`}
                        </h3>
                    </div>

                    {roundMatches.map(match => {
                        const isLive = !match.winnerId && (match.homeScore !== null || match.awayScore !== null);
                        
                        return (
                            <div key={match.id} className="relative group">
                                <div className={`
                                    bg-slate-900 border-2 rounded-2xl overflow-hidden transition-all duration-500
                                    ${isLive ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse' : 'border-white/5 opacity-80'}
                                    ${match.winnerId ? 'opacity-40 grayscale-[0.5]' : ''}
                                `}>
                                    {/* Match Header */}
                                    <div className="p-2 border-b border-white/5 bg-black/20 flex justify-between items-center px-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">
                                                Mesa {match.tableNumber || "TBD"}
                                            </span>
                                            {isLive && (
                                                <div className="flex items-center gap-1">
                                                    <Radio className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase animate-pulse">En Vivo</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Players */}
                                    <div className="flex flex-col">
                                        {/* Home */}
                                        <div className={`flex justify-between items-center p-3 px-4 ${match.winnerId === match.homePlayerId ? 'bg-emerald-500/10' : ''}`}>
                                            <p className={`text-[11px] font-black uppercase truncate max-w-[140px] ${match.winnerId === match.homePlayerId ? 'text-emerald-500' : 'text-white'}`}>
                                                {match.homePlayer?.user?.name || "TBD"}
                                            </p>
                                            <span className="font-mono text-sm font-black text-white">{match.homeScore ?? "-"}</span>
                                        </div>
                                        {/* Away */}
                                        <div className={`flex justify-between items-center p-3 px-4 border-t border-white/5 ${match.winnerId === match.awayPlayerId ? 'bg-emerald-500/10' : ''}`}>
                                            <p className={`text-[11px] font-black uppercase truncate max-w-[140px] ${match.winnerId === match.awayPlayerId ? 'text-emerald-500' : 'text-white'}`}>
                                                {match.awayPlayer?.user?.name || "???"}
                                            </p>
                                            <span className="font-mono text-sm font-black text-white">{match.awayScore ?? "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
