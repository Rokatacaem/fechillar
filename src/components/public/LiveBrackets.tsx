"use client";

import React, { useRef, useEffect } from "react";
import { Radio, Trophy } from "lucide-react";

interface Player {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    user?: { name?: string | null } | null;
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

function playerName(p: Player | null, fallback: string): string {
    if (!p) return fallback;
    return [p.firstName, p.lastName].filter(Boolean).join(' ') || p.user?.name || fallback;
}

function MatchCard({ match, isFinal = false }: { match: Match; isFinal?: boolean }) {
    const isLive = !match.winnerId && (match.homeScore !== null || match.awayScore !== null);

    return (
        <div className={`
            bg-slate-900 border-2 rounded-xl overflow-hidden transition-all duration-500 w-full
            ${isFinal ? 'min-w-[220px]' : 'min-w-[160px]'}
            ${isLive ? 'border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.2)] animate-pulse' : 'border-white/5'}
            ${match.winnerId ? 'opacity-50 grayscale-[0.4]' : ''}
        `}>
            <div className="px-3 py-1 border-b border-white/5 bg-black/20 flex justify-between items-center">
                <span className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">
                    Mesa {match.tableNumber || "—"}
                </span>
                {isLive && (
                    <div className="flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[7px] font-black text-emerald-500 uppercase animate-pulse">En Vivo</span>
                    </div>
                )}
            </div>

            <div className={`flex justify-between items-center px-3 py-1.5 ${match.winnerId === match.homePlayerId ? 'bg-emerald-500/10' : ''}`}>
                <p className={`text-[10px] font-black uppercase truncate max-w-[120px] ${match.winnerId === match.homePlayerId ? 'text-emerald-400' : 'text-white'}`}>
                    {playerName(match.homePlayer, 'TBD')}
                </p>
                <span className="font-mono text-xs font-black text-white ml-2">{match.homeScore ?? "—"}</span>
            </div>

            <div className={`flex justify-between items-center px-3 py-1.5 border-t border-white/5 ${match.winnerId === match.awayPlayerId ? 'bg-emerald-500/10' : ''}`}>
                <p className={`text-[10px] font-black uppercase truncate max-w-[120px] ${match.winnerId === match.awayPlayerId ? 'text-emerald-400' : 'text-white'}`}>
                    {playerName(match.awayPlayer, '???')}
                </p>
                <span className="font-mono text-xs font-black text-white ml-2">{match.awayScore ?? "—"}</span>
            </div>
        </div>
    );
}

function BracketColumn({ matches, label }: { matches: Match[]; label: string }) {
    return (
        <div className="flex flex-col gap-2 shrink-0">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-center pb-1 border-b border-white/5">
                {label}
            </h3>
            <div className="flex flex-col justify-around flex-grow gap-3">
                {matches.map(match => (
                    <MatchCard key={match.id} match={match} />
                ))}
            </div>
        </div>
    );
}

export function LiveBrackets({ matches }: { matches: Match[] }) {
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fit = () => {
            const outer = outerRef.current;
            const inner = innerRef.current;
            if (!outer || !inner) return;

            // Medir tamaño natural (sin escala aplicada)
            inner.style.transform = 'scale(1)';
            const natW = inner.scrollWidth;
            const natH = inner.scrollHeight;
            const aw = outer.clientWidth;
            const ah = outer.clientHeight;

            const s = Math.min(aw / natW, ah / natH, 1);
            inner.style.transform = `scale(${s})`;
            inner.style.transformOrigin = 'top center';
        };

        // rAF asegura que el DOM ya fue pintado antes de medir
        const raf = requestAnimationFrame(fit);
        const ro = new ResizeObserver(fit);
        if (outerRef.current) ro.observe(outerRef.current);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [matches]);

    const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);

    if (rounds.length === 0) return (
        <div className="flex items-center justify-center h-full text-slate-600 font-bold uppercase tracking-widest text-sm">
            Sin partidas generadas
        </div>
    );

    if (rounds.length === 1) {
        const roundMatches = matches.filter(m => m.round === rounds[0]).sort((a, b) => a.matchOrder - b.matchOrder);
        return (
            <div ref={outerRef} className="w-full h-full overflow-hidden flex items-start justify-center pt-4">
                <div ref={innerRef}>
                    <BracketColumn matches={roundMatches} label="Gran Final" />
                </div>
            </div>
        );
    }

    const finalRound  = rounds[rounds.length - 1];
    const finalMatches = matches.filter(m => m.round === finalRound).sort((a, b) => a.matchOrder - b.matchOrder);
    const preFinalRounds = rounds.slice(0, -1);

    const leftColumns:  { matches: Match[]; round: number }[] = [];
    const rightColumns: { matches: Match[]; round: number }[] = [];

    preFinalRounds.forEach(r => {
        const roundMatches = matches.filter(m => m.round === r).sort((a, b) => a.matchOrder - b.matchOrder);
        const half = Math.ceil(roundMatches.length / 2);
        leftColumns.push({ matches: roundMatches.slice(0, half), round: r });
        rightColumns.push({ matches: roundMatches.slice(half), round: r });
    });

    const rightColumnsDisplay = [...rightColumns].reverse();

    const roundLabel = (r: number, maxRound: number) => {
        const preFinals = maxRound - 1;
        if (r === preFinals)     return 'Semis';
        if (r === preFinals - 1) return 'Cuartos';
        return `Ronda ${r}`;
    };

    const maxRound = rounds[rounds.length - 2] ?? 0;

    return (
        <div ref={outerRef} className="w-full h-full overflow-hidden flex items-start justify-center pt-4">
            <div ref={innerRef} className="flex gap-6 p-6 items-center justify-center">
                {/* LEFT: primera ronda → semis */}
                {leftColumns.map((col) => (
                    <BracketColumn
                        key={`left-${col.round}`}
                        matches={col.matches}
                        label={roundLabel(col.round, maxRound + 1)}
                    />
                ))}

                <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-6 h-px bg-white/10" />
                </div>

                {/* CENTER: Gran Final */}
                <div className="flex flex-col items-center gap-3 shrink-0 px-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-yellow-500/30">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">Gran Final</h3>
                        <Trophy className="w-3 h-3 text-yellow-500" />
                    </div>
                    <div className="flex flex-col gap-3">
                        {finalMatches.map(match => (
                            <MatchCard key={match.id} match={match} isFinal />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-6 h-px bg-white/10" />
                </div>

                {/* RIGHT: semis → primera ronda */}
                {rightColumnsDisplay.map((col) => (
                    <BracketColumn
                        key={`right-${col.round}`}
                        matches={col.matches}
                        label={roundLabel(col.round, maxRound + 1)}
                    />
                ))}
            </div>
        </div>
    );
}
