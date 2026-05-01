import React from "react";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Swords, Trophy, Users, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { MatchScoreEditor } from "@/components/tournaments/MatchScoreEditor";
import { getTournamentPodium, getTournamentStandings, getTournamentStats } from "@/lib/tournament-results";
import { TournamentPodium } from "@/components/tournament/TournamentPodium";
import { CuadroHonor } from "@/components/tournaments/CuadroHonor";
import { TournamentStats } from "@/components/tournaments/TournamentStats";

import { generatePlayoffsFromGroups } from "../../matchmaking/actions";

export default async function TournamentBracketsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;

    // Obtener torneo con configuración de fases
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { phases: { orderBy: { order: 'asc' } } }
    });

    if (!tournament) return notFound();

    // Obtener llaves generadas con hándicap y jugadores
    const allMatches = await prisma.match.findMany({
        where: { tournamentId },
        orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
        include: {
            homePlayer: { include: { user: true, club: true } },
            awayPlayer: { include: { user: true, club: true } },
            phase: true
        }
    });

    // Agrupar por rondas
    const rounds = Array.from(new Set(allMatches.map(m => m.round))).sort((a, b) => a - b);
    const matchesByRound = rounds.map(r => allMatches.filter(m => m.round === r));

    // Determinar si hay podio y ranking
    let podiumData = null;
    let standingsData: any[] = [];
    let statsData = null;

    if (tournament.status === "FINISHED") {
        podiumData = await getTournamentPodium(tournamentId);
        standingsData = await getTournamentStandings(tournamentId);
        statsData = await getTournamentStats(tournamentId);
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto overflow-hidden p-6">
            {/* Nav & Info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link
                        href={`/tournaments`}
                        className="p-4 rounded-2xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-xl"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                                Cuadros <span className="text-emerald-500">Hándicap</span>
                            </h1>
                            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Motor v3.0
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-2">
                             {tournament.name} • {tournament.discipline}
                        </p>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="hidden md:flex gap-4">
                    <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Capacidad</p>
                            <p className="text-xl font-black text-white">{tournament.maxPlayers} <span className="text-slate-600 text-xs">Cupos</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Podio y Estadísticas */}
            {podiumData && (
                <div className="grid grid-cols-1 gap-12 mb-16">
                    <TournamentPodium 
                        champion={podiumData.champion} 
                        runnerUp={podiumData.runnerUp} 
                        bronze={podiumData.bronzes} 
                    />
                    
                    {statsData && (
                        <TournamentStats 
                            bestRun={statsData.bestRun}
                            bestAverage={statsData.bestAverage}
                        />
                    )}
                </div>
            )}
            {/* Cuadro de Honor (Ranking 1-22) */}
            {standingsData.length > 0 && (
                <div className="mb-16">
                    <CuadroHonor participants={standingsData} tournamentId={tournamentId} />
                </div>
            )}

            {/* Bracket Visualizer */}
            {allMatches.length === 0 ? (
                <div className="bg-slate-900/40 border border-white/5 p-24 rounded-[3rem] text-center backdrop-blur-3xl shadow-2xl">
                    <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                        <Swords className="w-10 h-10 text-slate-600" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Sin actividad algorítmica</h2>
                    <p className="text-slate-500 max-w-sm mx-auto mb-8">Genera las llaves desde el panel de control o usa el motor de grupos para clasificar a los mejores.</p>
                    
                    <form action={async () => {
                        "use server";
                        await generatePlayoffsFromGroups(tournamentId);
                    }}>
                        <button 
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center gap-2 mx-auto"
                        >
                            <Trophy className="w-4 h-4" />
                            Finalizar Grupos y Generar Cuadro
                        </button>
                    </form>
                </div>
            ) : (
                <div className="flex gap-20 overflow-x-auto pb-12 pt-4 items-start scrollbar-hide select-none">
                    {matchesByRound.map((roundMatches, roundIndex) => (
                        <div key={`round-${roundIndex}`} className="flex flex-col gap-10 min-w-[340px] shrink-0 justify-around h-full">
                            <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md pb-4 pt-2">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-between border-b border-white/5 pb-3">
                                    {roundIndex === rounds.length - 1 ? 'Gran Final' : `Ronda ${rounds[roundIndex]}`}
                                    <span className="bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-[9px] border border-white/5">
                                        {roundMatches.length} Partidos
                                    </span>
                                </h3>
                            </div>

                            {roundMatches.map(match => (
                                <div key={match.id} className={`relative group transition-all ${match.winnerId ? 'opacity-60 saturate-50' : 'hover:scale-[1.02] scale-100'}`}>
                                    {/* Conector Visual a la Derecha */}
                                    {roundIndex < rounds.length - 1 && (
                                        <div className="hidden lg:block absolute top-[50%] -right-10 w-10 h-[2px] bg-gradient-to-r from-slate-800 to-slate-900" />
                                    )}
                                    
                                    <div className={`bg-slate-900/80 border-2 ${match.winnerId ? 'border-emerald-500/20' : 'border-white/5 shadow-2xl'} rounded-3xl overflow-hidden backdrop-blur-xl transition-all shadow-black/50`}>
                                        <div className="p-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center px-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">
                                                    Mesa {match.tableNumber || "TBD"}
                                                </span>
                                                {match.phase?.hasEqualizingInning === false && (
                                                    <span className="bg-rose-500/10 text-rose-500 text-[8px] px-2 py-0.5 rounded-full font-black border border-rose-500/20 uppercase tracking-tighter">
                                                        Sin Contrasalida
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">
                                                ID {match.matchOrder}
                                            </span>
                                        </div>
                                        
                                        {/* Home Player Slot */}
                                        <div className={`flex items-center justify-between p-4 px-5 border-b border-white/5 relative ${match.winnerId === match.homePlayerId ? 'bg-emerald-500/10' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                                                    {match.homeTarget || '??'}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-black truncate max-w-[160px] ${!match.homePlayer ? 'text-slate-600 italic' : 'text-white'}`}>
                                                        {match.homePlayer?.user?.name || "Reservado TBD"}
                                                    </p>
                                                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                                                        {match.homePlayer?.club?.name || "Esperando Clasificación"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-mono text-xl text-white font-black">{match.homeScore ?? "-"}</span>
                                        </div>

                                        {/* Away Player Slot */}
                                        <div className={`flex items-center justify-between p-4 px-5 relative ${match.winnerId === match.awayPlayerId ? 'bg-emerald-500/10' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                                                    {match.awayTarget || '??'}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-black truncate max-w-[160px] ${!match.awayPlayer ? 'text-slate-600 italic' : 'text-white'}`}>
                                                        {match.awayPlayer?.user?.name || (match.isWO ? "BYE" : "Esperando rival")}
                                                    </p>
                                                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                                                        {match.awayPlayer?.club?.name || "..."}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-mono text-xl text-slate-400 font-black">
                                                {match.isWO ? "W.O" : (match.awayScore ?? "-")}
                                            </span>
                                        </div>
                                        
                                        {/* Dynamic Control Overlay */}
                                        <div className="p-3 bg-black/20 flex items-center justify-between px-5">
                                            <div className="flex gap-2">
                                                {/* Botón de Swap para SuperAdmin (Placeholder UI) */}
                                                {(session?.user as any)?.role === 'SUPERADMIN' && !match.winnerId && (
                                                    <button className="p-2 rounded-lg bg-slate-800 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-all" title="Reemplazo Táctico">
                                                        <ShieldAlert className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <MatchScoreEditor 
                                                matchId={match.id} 
                                                hasWinner={match.winnerId !== null} 
                                                isWO={match.isWO} 
                                                homeScore={match.homeScore} 
                                                awayScore={match.awayScore}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    
                    {/* Final Trophy Slot */}
                    <div className="flex flex-col gap-6 min-w-[340px] opacity-20 pointer-events-none justify-center h-full">
                         <div className="bg-slate-900 border-4 border-emerald-500/20 shadow-2xl rounded-[3rem] h-64 flex flex-col items-center justify-center relative">
                             <div className="absolute top-[50%] -left-10 w-10 h-[2px] bg-slate-800" />
                             <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                                <Trophy className="w-12 h-12 text-emerald-500" />
                             </div>
                             <h3 className="text-xl font-black text-emerald-500 uppercase tracking-[0.4em]">
                                 Campeón
                             </h3>
                             <p className="text-slate-600 text-[10px] font-black uppercase mt-2">FECHILLAR 2026</p>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}

