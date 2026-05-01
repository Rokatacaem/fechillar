import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Shuffle, Trophy, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { MatchResultForm } from "./MatchResultForm";
import { CloseTournamentButton } from "./CloseTournamentButton";
import GenerateBracketButton from "./GenerateBracketButton";
import { generateRoundRobinMatches, generateMatchesByGroup } from "./actions";

export default async function ResultadosPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const { id: tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            registrations: {
                where: { status: "APPROVED" },
                include: {
                    player: {
                        include: { user: true, club: true }
                    }
                }
            },
            matches: {
                include: {
                    homePlayer: { include: { user: true, club: true } },
                    awayPlayer: { include: { user: true, club: true } },
                    group: { select: { name: true } }
                },
                orderBy: { matchOrder: "asc" }
            }
        }
    });

    if (!tournament) return notFound();

    const config = tournament.config as any;
    // Forzado global a 35 para el Nacional de Mayo según bases
    const inningLimit: number = 35; 

    const isNational = tournament.scope === "NATIONAL";
    const isApproved = tournament.officializationStatus === "APPROVED";

    const totalMatches = tournament.matches.length;
    const completedMatches = tournament.matches.filter(m => m.winnerId !== null || m.isWO || (m.homeInnings ?? 0) > 0).length;
    const pendingMatches = totalMatches - completedMatches;

    const playerName = (player: any) =>
        player?.user?.name || `${player?.firstName || ""} ${player?.lastName || ""}`.trim() || "Sin nombre";
    const playerClub = (player: any) => player?.club?.name || "Libre";

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/tournaments/${tournamentId}/inscripciones`}
                    className="p-3 rounded-2xl bg-slate-800 border border-white/5 text-slate-400 hover:text-white transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                        Ingreso de <span className="text-emerald-500">Resultados</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                        {tournament.name}
                    </p>
                </div>
            </div>

            {/* Stats + Acciones */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel izquierdo: stats + controles */}
                <div className="space-y-4">
                    {/* Contadores */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado del Torneo</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    Completadas
                                </span>
                                <span className="text-sm font-black text-emerald-400">{completedMatches}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    Pendientes
                                </span>
                                <span className="text-sm font-black text-amber-400">{pendingMatches}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                                    <Trophy className="w-3.5 h-3.5 text-slate-500" />
                                    Jugadores
                                </span>
                                <span className="text-sm font-black text-white">{tournament.registrations.length}</span>
                            </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: totalMatches > 0 ? `${(completedMatches / totalMatches) * 100}%` : "0%" }}
                            />
                        </div>
                        <p className="text-[9px] text-slate-600 text-center font-bold">
                            {totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}% completado
                        </p>
                    </div>

                    {/* Generar partidas (si no hay ninguna) */}
                    {totalMatches === 0 && (
                        <div className="space-y-3">
                            <form action={async () => {
                                "use server";
                                await generateRoundRobinMatches(tournamentId);
                            }}>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-slate-800 border border-white/5 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Shuffle className="w-4 h-4" />
                                    Generar RR (Todos vs Todos)
                                </button>
                            </form>

                            <form action={async () => {
                                "use server";
                                await generateMatchesByGroup(tournamentId);
                            }}>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    <Trophy className="w-4 h-4" />
                                    Generar por Grupos (Audit)
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Alerta de modo retroactivo */}
                    {isNational && !isApproved && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-300 leading-relaxed">
                                Torneo NACIONAL sin homologar. Al cerrar, los puntos se acreditarán de forma retroactiva al Ranking Nacional.
                            </p>
                        </div>
                    )}

                    {/* Cierre */}
                    {totalMatches > 0 && tournament.status !== "FINISHED" && (
                        <div className="space-y-4">
                            <GenerateBracketButton 
                                tournamentId={tournamentId}
                                hasPendingMatches={pendingMatches > 0}
                                hasExistingBracket={tournament.matches.some(m => m.id.includes("_W") || m.id.includes("_L"))}
                            />

                            <CloseTournamentButton
                                tournamentId={tournamentId}
                                isNational={isNational}
                                isApproved={isApproved}
                                pendingMatches={pendingMatches}
                            />
                        </div>
                    )}

                    {tournament.status === "FINISHED" && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Torneo Cerrado</p>
                            <Link
                                href={`/tournaments/${tournamentId}/ranking`}
                                className="mt-3 block text-[10px] text-slate-400 underline hover:text-white transition-colors"
                            >
                                Ver Ranking Final →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Panel derecho: lista de partidas */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Partidas ({totalMatches})
                        </h3>
                        <span className="text-[9px] text-slate-600 font-bold uppercase">
                            Límite: {inningLimit} entradas
                        </span>
                    </div>

                    {totalMatches === 0 ? (
                        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center">
                            <Shuffle className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm font-bold">
                                No hay partidas generadas.
                            </p>
                            <p className="text-slate-600 text-xs mt-1">
                                Selecciona un método de generación para comenzar a ingresar resultados.
                            </p>
                        </div>
                    ) : (
                        (() => {
                             // Agrupar partidas por nombre de grupo o fase
                             const groupsMap: Record<string, any[]> = {};
                             tournament.matches.forEach(m => {
                                 let groupName = (m as any).group?.name;
                                 if (!groupName) {
                                     groupName = m.id.startsWith(tournament.id) ? "Eliminatorias" : "Sin Grupo";
                                 }
                                 if (!groupsMap[groupName]) groupsMap[groupName] = [];
                                 groupsMap[groupName].push(m);
                             });

                             return Object.entries(groupsMap).map(([groupName, matches]) => {
                                 const isKnockout = groupName === "Eliminatorias";
                                 const label = isKnockout ? "Cuadro de Eliminación Directa" : (groupName === "Sin Grupo" ? "Otras Partidas" : `Fase de Grupos: ${groupName}`);

                                 return (
                                     <div key={groupName} className="space-y-3 mb-8">
                                         <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg inline-block ${isKnockout ? "text-amber-500 bg-amber-500/5" : "text-emerald-500 bg-emerald-500/5"}`}>
                                             {label}
                                         </h4>
                                    {matches.map(match => {
                                        if (!match.homePlayer || !match.awayPlayer) return null;

                                        const isMatchPlayed = match.winnerId !== null || match.isWO || (match.homeInnings ?? 0) > 0;
                                        // Las partidas de eliminación directa tienen IDs generados con prefijo del torneo + _W o _L
                                        const isKnockout = match.id.startsWith(tournament.id);
                                        const existingResult = isMatchPlayed ? {
                                            homeScore: match.homeScore ?? 0,
                                            awayScore: match.awayScore ?? 0,
                                            homeInnings: match.homeInnings ?? inningLimit,
                                            awayInnings: match.awayInnings ?? inningLimit,
                                            homeHighRun: match.homeHighRun ?? 0,
                                            awayHighRun: match.awayHighRun ?? 0,
                                            winnerId: match.winnerId,
                                            refereeName: match.refereeName,
                                        } : null;

                                        return (
                                            <MatchResultForm
                                                key={match.id}
                                                matchId={match.id}
                                                homePlayer={{
                                                    id: match.homePlayer.id,
                                                    name: playerName(match.homePlayer),
                                                    club: playerClub(match.homePlayer),
                                                }}
                                                awayPlayer={{
                                                    id: match.awayPlayer.id,
                                                    name: playerName(match.awayPlayer),
                                                    club: playerClub(match.awayPlayer),
                                                }}
                                                inningLimit={inningLimit}
                                                allowDraws={!isKnockout}
                                                groupId={match.groupId}
                                                existingResult={existingResult}
                                            />
                                        );
                                    })}
                                     </div>
                                 );
                             });
                         })()
                    )}
                </div>
            </div>
        </div>
    );
}
