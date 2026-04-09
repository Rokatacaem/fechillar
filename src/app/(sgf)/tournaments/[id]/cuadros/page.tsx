import React from "react";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Swords, Trophy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { MatchScoreEditor } from "@/components/tournaments/MatchScoreEditor";

export default async function TournamentBracketsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;

    // Obtener torneo
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId }
    });

    if (!tournament) return notFound();

    // Obtener llaves generadas
    const allMatches = await prisma.match.findMany({
        where: { tournamentId },
        orderBy: { matchOrder: 'asc' },
        include: {
            homePlayer: { include: { user: true, club: true } },
            awayPlayer: { include: { user: true, club: true } }
        }
    });

    // Agrupar por rondas
    const rounds = Array.from(new Set(allMatches.map(m => m.round))).sort((a, b) => a - b);
    const matchesByRound = rounds.map(r => allMatches.filter(m => m.round === r));

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto overflow-hidden">
            {/* Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/tournaments/${tournamentId}/inscripciones`}
                        className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                            CUADROS <span className="text-emerald-500">COMPETITIVOS</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
                            {tournament.name} - Ronda 1
                        </p>
                    </div>
                </div>
            </div>

            {/* Bracket Visualizer */}
            {allMatches.length === 0 ? (
                <div className="bg-slate-900/40 border border-white/5 p-12 rounded-3xl text-center">
                    <Swords className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">Aún no se han generado las llaves algorítmicas.</p>
                </div>
            ) : (
                <div className="flex gap-16 overflow-x-auto pb-8 items-start h-full">
                    {matchesByRound.map((roundMatches, roundIndex) => (
                        <div key={`round-${roundIndex}`} className="flex flex-col gap-6 min-w-[320px] shrink-0 justify-around h-full">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center justify-between border-b border-white/10 pb-2">
                                Ronda {rounds[roundIndex]}
                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                                    {roundMatches.length} Partidos
                                </span>
                            </h3>

                            {roundMatches.map(match => (
                                <div key={match.id} className={`relative group ${match.winnerId ? 'opacity-70' : ''}`}>
                                    {/* Conector visual derecho (hacia siguiente ronda) */}
                                    {roundIndex < rounds.length && (
                                        <div className="hidden lg:block absolute top-1/2 -right-8 w-8 h-[2px] bg-slate-800 group-hover:bg-emerald-500/50 transition-colors" />
                                    )}
                                    {/* Conector visual izquierdo (desde ronda anterior) */}
                                    {roundIndex > 0 && (
                                        <div className="hidden lg:block absolute top-1/2 -left-8 w-8 h-[2px] bg-slate-800 transition-colors" />
                                    )}
                                    
                                    <div className={`bg-slate-900/80 border ${match.winnerId ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg' : 'border-white/5'} rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm hover:border-emerald-500/30 transition-all`}>
                                        <div className="p-2 border-b border-white/5 bg-black/20 flex justify-between items-center px-4">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">
                                                Mesa {match.tableNumber || "TBD"}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-bold">
                                                R{match.round} M-{match.matchOrder}
                                            </span>
                                        </div>
                                        
                                        {/* Home Player */}
                                        <div className={`flex items-center justify-between p-3 px-4 border-b border-white/5 relative ${match.winnerId === match.homePlayerId ? 'bg-emerald-500/10' : 'bg-white/[0.01]'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {(match.matchOrder * 2) - 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white truncate max-w-[150px]">
                                                        {match.homePlayer?.user?.name || "TBD"}
                                                    </p>
                                                    <p className="text-[9px] uppercase tracking-widest text-slate-500">
                                                        {match.homePlayer?.club?.name || "Esperando rival"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-mono text-sm text-white font-black">{match.homeScore !== null ? match.homeScore : "-"}</span>
                                        </div>

                                        {/* Away Player */}
                                        <div className={`flex items-center justify-between p-3 px-4 ${match.winnerId === match.awayPlayerId ? 'bg-emerald-500/10' : 'opacity-80'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0 text-slate-500">
                                                    {match.matchOrder * 2}
                                                </div>
                                                <div>
                                                    {match.awayPlayerId === "TBD" ? (
                                                        <p className="text-sm font-bold text-slate-500 truncate max-w-[150px] italic">
                                                            Esperando cruce
                                                        </p>
                                                    ) : match.awayPlayer ? (
                                                        <p className="text-sm font-bold text-white truncate max-w-[150px]">
                                                            {match.awayPlayer.user?.name}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm font-bold text-yellow-500 truncate max-w-[150px] italic">
                                                            BYE (Pase Directo)
                                                        </p>
                                                    )}
                                                    <p className="text-[9px] uppercase tracking-widest text-slate-600">
                                                        {match.awayPlayer?.club?.name || "..."}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-mono text-sm text-slate-400">{match.isWO ? "-" : (match.awayScore !== null ? match.awayScore : "-")}</span>
                                        </div>
                                        
                                        {/* Interactive Editor Button */}
                                        <MatchScoreEditor 
                                            matchId={match.id} 
                                            hasWinner={match.winnerId !== null} 
                                            isWO={match.isWO} 
                                            homeScore={match.homeScore} 
                                            awayScore={match.awayScore}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    
                    {/* Final Placeholder */}
                    <div className="flex flex-col gap-6 min-w-[320px] opacity-20 pointer-events-none justify-center h-full">
                         <div className="bg-slate-900 border border-emerald-500/20 shadow-xl shadow-emerald-500/5 rounded-xl h-32 flex flex-col items-center justify-center relative">
                             <div className="absolute top-1/2 -left-8 w-8 h-[2px] bg-slate-800" />
                             <Trophy className="w-10 h-10 text-emerald-500 mb-2" />
                             <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                                 CAMPEÓN
                             </h3>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}
