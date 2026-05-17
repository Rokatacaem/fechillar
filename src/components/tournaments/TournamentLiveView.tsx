"use client";

import React, { useState, useMemo } from "react";
import { useTournamentLive } from "@/hooks/use-tournament-live";
import {
    Trophy, Users, ListOrdered, Play, Activity, Star,
    Calendar, Search, Loader2, Medal, X
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LiveGeneralRanking } from "../public/LiveGeneralRanking";

interface Props {
    tournamentId: string;
}

// ─── Helpers de fase eliminatoria ────────────────────────────────────────────

function getPhaseName(round: number, totalRounds: number): string {
    const fromFinal = totalRounds - round;
    if (fromFinal === 0) return "Final";
    if (fromFinal === 1) return "Semifinal";
    if (fromFinal === 2) return "Cuartos de Final";
    if (fromFinal === 3) return "Octavos de Final";
    return `Ronda ${round}`;
}

function getPhaseShortName(round: number, totalRounds: number): string {
    const fromFinal = totalRounds - round;
    if (fromFinal === 0) return "Final";
    if (fromFinal === 1) return "Semi";
    if (fromFinal === 2) return "Cuartos";
    if (fromFinal === 3) return "Octavos";
    return `R${round}`;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function TournamentLiveView({ tournamentId }: Props) {
    const { data, isLoading, error } = useTournamentLive(tournamentId, 15000);
    const [activeTab, setActiveTab] = useState<string>("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [showRankingOverlay, setShowRankingOverlay] = useState(false);

    // Hooks SIEMPRE antes de cualquier early return (Rules of Hooks)
    const knockoutMatches = useMemo(
        () => (data?.matches || []).filter((m: any) => !m.groupId),
        [data?.matches]
    );
    const maxKnockoutRound = knockoutMatches.length > 0
        ? Math.max(...knockoutMatches.map((m: any) => m.round))
        : 0;
    const knockoutRounds = maxKnockoutRound > 0
        ? Array.from({ length: maxKnockoutRound }, (_, i) => i + 1)
        : [];

    if (isLoading) return <LiveLoader />;
    if (error || !data) return <LiveError />;

    const tournament = data.tournament as any;
    const totalCarambolas: number = (data.allStandings || []).reduce(
        (sum: number, s: any) => sum + (s.carambolas ?? 0), 0
    );

    // Tabs dinámicos
    const baseTabs = [
        { id: "overview", label: "Vista General", short: "General", icon: Activity },
        { id: "groups",   label: "Fase de Grupos", short: "Grupos",  icon: ListOrdered },
    ];
    const phaseTabs = knockoutRounds.map(round => ({
        id: `phase_${round}`,
        label: getPhaseName(round, maxKnockoutRound),
        short: getPhaseShortName(round, maxKnockoutRound),
        icon: maxKnockoutRound - round === 0 ? Trophy : maxKnockoutRound - round === 1 ? Star : Medal,
        round,
    }));
    const rankingTab = { id: "ranking", label: "Ranking General", short: "Ranking", icon: Trophy };
    const allTabs = [...baseTabs, ...phaseTabs, rankingTab];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-violet-500/30">

            {/* ── Overlay de Ranking ─────────────────────────────────── */}
            {showRankingOverlay && (
                <div className="fixed inset-0 z-50 bg-[#020617]/97 backdrop-blur-xl flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                        <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <ListOrdered className="w-5 h-5 text-violet-400" />
                            Ranking en Tiempo Real
                        </h2>
                        <button
                            onClick={() => setShowRankingOverlay(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                            <X className="w-4 h-4" /> Cerrar
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <LiveGeneralRanking
                            standings={data.allStandings || []}
                            classifyCount={data.classifyCount ?? 8}
                            totalCarambolas={totalCarambolas}
                        />
                    </div>
                </div>
            )}

            {/* ── Header Hero ────────────────────────────────────────── */}
            <div className="relative h-[35vh] min-h-[220px] overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-600/20 to-[#020617] z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070')] bg-cover bg-center opacity-30 mix-blend-overlay" />

                <div className="relative z-20 h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-8">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-violet-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">En Vivo</span>
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
                            {tournament.discipline}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-3 leading-none">
                        {tournament.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold text-sm">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-400" /> {format(new Date(tournament.startDate), "PPP", { locale: es })}</span>
                        <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-violet-400" /> {tournament.category}</span>
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-violet-400" /> {tournament.registrations?.length || 0} Atletas</span>
                    </div>

                    <div className="mt-6 max-w-md w-full relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar jugador o club..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ── Navegación ─────────────────────────────────────────── */}
            <div className="sticky top-0 z-40 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-1 overflow-x-auto no-scrollbar">
                    {allTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 h-full px-3 border-b-2 transition-all text-[11px] font-black uppercase tracking-widest whitespace-nowrap shrink-0 ${
                                activeTab === tab.id
                                ? "border-violet-500 text-white"
                                : "border-transparent text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.short}</span>
                        </button>
                    ))}

                    {/* Botón Ranking — siempre visible al extremo derecho */}
                    <div className="ml-auto pl-2 shrink-0">
                        <button
                            onClick={() => setShowRankingOverlay(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 hover:text-violet-200 text-[11px] font-black uppercase tracking-widest rounded-xl border border-violet-500/30 transition-all"
                        >
                            <ListOrdered className="w-3.5 h-3.5" />
                            <span>Ver Ranking</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Contenido Principal ────────────────────────────────── */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                {searchTerm ? (
                    <SearchResults
                        searchTerm={searchTerm}
                        groups={data.groups}
                        allStandings={data.allStandings}
                        matches={data.matches}
                    />
                ) : (
                    <>
                        {activeTab === "overview" && <Overview data={data} />}
                        {activeTab === "groups"   && <GroupStandingsView data={data} />}
                        {activeTab === "ranking"  && (
                            <LiveGeneralRanking
                                standings={data.allStandings || []}
                                classifyCount={data.classifyCount ?? 8}
                                totalCarambolas={totalCarambolas}
                            />
                        )}
                        {knockoutRounds.map(round =>
                            activeTab === `phase_${round}` ? (
                                <PhaseMatchesView
                                    key={round}
                                    matches={knockoutMatches.filter((m: any) => m.round === round)}
                                    phaseName={getPhaseName(round, maxKnockoutRound)}
                                />
                            ) : null
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

// ─── Vista General ────────────────────────────────────────────────────────────

function Overview({ data }: { data: any }) {
    const liveMatches = data.matches?.filter((m: any) => m.status === "PLAYING") || [];
    const recentMatches = data.matches?.filter((m: any) => m.status === "FINISHED").slice(0, 4) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
                <section>
                    <h2 className="text-xl font-black text-white mb-5 flex items-center gap-3">
                        <Play className="w-5 h-5 text-emerald-500 fill-emerald-500" /> Partidas en Curso
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {liveMatches.length > 0 ? liveMatches.map((match: any) => (
                            <MatchCard key={match.id} match={match} />
                        )) : (
                            <div className="p-10 border-2 border-dashed border-white/5 rounded-[2rem] text-center">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Esperando inicio de partidas...</p>
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-black text-white mb-5">Resultados Recientes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentMatches.map((match: any) => (
                            <MatchCardSmall key={match.id} match={match} />
                        ))}
                    </div>
                </section>
            </div>

            <aside className="space-y-8">
                <section className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-7">
                    <h3 className="text-xs font-black uppercase tracking-widest text-violet-400 mb-5 flex items-center gap-2">
                        <Star className="w-4 h-4" /> Top Promedio
                    </h3>
                    <div className="space-y-4">
                        {data.topPerformers?.byAverage?.slice(0, 5).map((p: any, i: number) => (
                            <div key={p.playerId} className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-700 w-4">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{p.playerName}</p>
                                    <p className="text-[10px] text-slate-500 font-medium truncate uppercase">{p.clubName}</p>
                                </div>
                                <span className="text-sm font-black text-emerald-400 tabular-nums">{p.average.toFixed(3)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-7">
                    <h3 className="text-xs font-black uppercase tracking-widest text-violet-400 mb-5 flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> Mayor Serie
                    </h3>
                    <div className="space-y-4">
                        {data.topPerformers?.byHighRun?.slice(0, 5).map((p: any, i: number) => (
                            <div key={p.playerId} className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-700 w-4">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{p.playerName}</p>
                                    <p className="text-[10px] text-slate-500 font-medium truncate uppercase">{p.clubName}</p>
                                </div>
                                <span className="text-sm font-black text-violet-400 tabular-nums">{p.highRun}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </aside>
        </div>
    );
}

// ─── Vista Fase de Grupos ─────────────────────────────────────────────────────

function GroupStandingsView({ data }: { data: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.groups?.map((group: any) => (
                <div key={group.id} className="bg-slate-900/40 border border-white/10 rounded-[2rem] overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-violet-400">{group.name}</h3>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                            {group.standings?.filter((s: any) => s.played > 0).length || 0} jugados
                        </span>
                    </div>
                    {/* Cabecera tabla */}
                    <div className="grid grid-cols-12 gap-1 px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Atleta</div>
                        <div className="col-span-2 text-center">PTS</div>
                        <div className="col-span-2 text-center">AVG</div>
                        <div className="col-span-2 text-center">HR</div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {(group.standings || []).map((s: any, i: number) => (
                            <div key={s.playerId} className={`grid grid-cols-12 items-center gap-1 px-4 py-2 ${i < (data.tournament?.config as any)?.advancingCount ? "bg-emerald-500/[0.04]" : ""}`}>
                                <div className={`col-span-1 text-[10px] font-black ${i < (data.tournament?.config as any)?.advancingCount ? "text-emerald-400" : "text-slate-600"}`}>{i + 1}</div>
                                <div className="col-span-5 min-w-0">
                                    <p className="text-[10px] font-black text-white truncate uppercase leading-tight">{s.playerName}</p>
                                    <p className="text-[8px] text-slate-600 font-bold uppercase truncate">{s.clubName}</p>
                                </div>
                                <div className="col-span-2 text-center text-[10px] font-black text-white tabular-nums">{s.points}</div>
                                <div className="col-span-2 text-center text-[9px] font-bold text-slate-400 tabular-nums">{s.average.toFixed(3)}</div>
                                <div className="col-span-2 text-center text-[9px] font-black text-violet-400 tabular-nums">{s.highRun}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Vista de Fase Eliminatoria ───────────────────────────────────────────────

function PhaseMatchesView({
    matches,
    phaseName,
}: {
    matches: any[];
    phaseName: string;
}) {
    const pending = matches.filter(m => !m.winnerId && !m.isWO);
    const completed = matches.filter(m => m.winnerId || m.isWO);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{phaseName}</h2>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />{completed.length} completadas</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600" />{pending.length} pendientes</span>
                </div>
            </div>

            {matches.length === 0 ? (
                <div className="py-20 text-center">
                    <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">No hay partidas registradas para esta fase aún</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {matches.map((match: any, i: number) => (
                        <EliminationMatchCard key={match.id} match={match} position={i + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

function EliminationMatchCard({ match, position }: { match: any; position: number }) {
    const homeWon = match.winnerId === match.homePlayerId;
    const awayWon = match.winnerId === match.awayPlayerId;
    const isCompleted = !!(match.winnerId || match.isWO);
    const isPending = !isCompleted;

    const homeName = match.homePlayer
        ? `${match.homePlayer.firstName} ${match.homePlayer.lastName}`
        : "Por definir";
    const awayName = match.awayPlayer
        ? `${match.awayPlayer.firstName} ${match.awayPlayer.lastName}`
        : "Por definir";

    return (
        <div className={`rounded-[2rem] border overflow-hidden ${isCompleted ? "border-white/10 bg-slate-900/40" : "border-violet-500/20 bg-violet-500/[0.04]"}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Partida {position}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isCompleted ? "text-emerald-400 bg-emerald-500/10" : "text-violet-400 bg-violet-500/10"}`}>
                    {isCompleted ? "Finalizado" : "Pendiente"}
                </span>
            </div>

            {/* Jugador 1 */}
            <div className={`flex items-center gap-4 px-5 py-4 border-b border-white/5 ${homeWon ? "bg-emerald-500/10" : ""}`}>
                <div className={`w-1.5 h-8 rounded-full ${homeWon ? "bg-emerald-500" : isPending ? "bg-slate-700" : "bg-rose-500/40"}`} />
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black truncate uppercase leading-tight ${homeWon ? "text-emerald-300" : match.homePlayer ? "text-white" : "text-slate-600"}`}>
                        {homeName}
                    </p>
                    {match.homePlayer?.club && (
                        <p className="text-[9px] text-slate-600 font-bold uppercase truncate">{match.homePlayer.club.name}</p>
                    )}
                </div>
                {isCompleted && (
                    <span className={`text-xl font-black tabular-nums ${homeWon ? "text-emerald-400" : "text-slate-600"}`}>
                        {match.homeScore ?? (match.isWO && !homeWon ? "WO" : "-")}
                    </span>
                )}
            </div>

            {/* Jugador 2 */}
            <div className={`flex items-center gap-4 px-5 py-4 ${awayWon ? "bg-emerald-500/10" : ""}`}>
                <div className={`w-1.5 h-8 rounded-full ${awayWon ? "bg-emerald-500" : isPending ? "bg-slate-700" : "bg-rose-500/40"}`} />
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black truncate uppercase leading-tight ${awayWon ? "text-emerald-300" : match.awayPlayer ? "text-white" : "text-slate-600"}`}>
                        {awayName}
                    </p>
                    {match.awayPlayer?.club && (
                        <p className="text-[9px] text-slate-600 font-bold uppercase truncate">{match.awayPlayer.club.name}</p>
                    )}
                </div>
                {isCompleted && (
                    <span className={`text-xl font-black tabular-nums ${awayWon ? "text-emerald-400" : "text-slate-600"}`}>
                        {match.awayScore ?? (match.isWO && !awayWon ? "WO" : "-")}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Tarjetas de Partida ──────────────────────────────────────────────────────

function MatchCard({ match }: { match: any }) {
    return (
        <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
                <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
            </div>
            <div className="grid grid-cols-7 items-center gap-4">
                <div className="col-span-3 text-right">
                    <p className="text-xl font-black text-white leading-tight">{match.homePlayer?.firstName} {match.homePlayer?.lastName}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{match.homePlayer?.club?.name}</p>
                </div>
                <div className="col-span-1 flex flex-col items-center">
                    <div className="bg-white/10 text-white text-[10px] font-black px-2 py-1 rounded-lg border border-white/5 mb-3">VS</div>
                    <div className="text-3xl font-black tabular-nums tracking-tighter text-violet-400 flex items-center gap-2">
                        <span>{match.homeScore ?? 0}</span>
                        <span className="text-slate-800">-</span>
                        <span>{match.awayScore ?? 0}</span>
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Ent: {match.homeInnings ?? 0}
                    </div>
                </div>
                <div className="col-span-3 text-left">
                    <p className="text-xl font-black text-white leading-tight">{match.awayPlayer?.firstName} {match.awayPlayer?.lastName}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{match.awayPlayer?.club?.name}</p>
                </div>
            </div>
        </div>
    );
}

function MatchCardSmall({ match }: { match: any }) {
    return (
        <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-5 flex items-center justify-between hover:bg-slate-900/40 transition-all">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-bold ${match.winnerId === match.homePlayerId ? "text-white" : "text-slate-500"}`}>
                        {match.homePlayer?.lastName}
                    </span>
                    <span className={`text-xs font-black tabular-nums ${match.winnerId === match.homePlayerId ? "text-emerald-400" : "text-slate-500"}`}>
                        {match.homeScore}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${match.winnerId === match.awayPlayerId ? "text-white" : "text-slate-500"}`}>
                        {match.awayPlayer?.lastName}
                    </span>
                    <span className={`text-xs font-black tabular-nums ${match.winnerId === match.awayPlayerId ? "text-emerald-400" : "text-slate-500"}`}>
                        {match.awayScore}
                    </span>
                </div>
            </div>
            <div className="ml-5 pl-5 border-l border-white/5 text-right">
                <p className="text-[10px] font-black text-slate-600 uppercase">{match.refereeName || "Mesa"}</p>
                <p className="text-[9px] text-slate-700 font-bold uppercase mt-1">{match.homeInnings} ENT.</p>
            </div>
        </div>
    );
}

// ─── Búsqueda ─────────────────────────────────────────────────────────────────

function SearchResults({ searchTerm, groups, allStandings, matches }: any) {
    const s = searchTerm.toLowerCase();
    const results = allStandings?.filter((p: any) =>
        p.playerName.toLowerCase().includes(s) || p.clubName.toLowerCase().includes(s)
    ) || [];

    if (results.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 font-bold uppercase tracking-widest">No se encontraron atletas con "{searchTerm}"</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-white">Resultados para "{searchTerm}"</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((player: any) => {
                    const playerGroup = groups?.find((g: any) => g.standings?.some((st: any) => st.playerId === player.playerId));
                    const nextMatch = matches?.find((m: any) =>
                        (m.homePlayerId === player.playerId || m.awayPlayerId === player.playerId) && m.status === "PENDING"
                    );

                    return (
                        <div key={player.playerId} className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-7 overflow-hidden relative">
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-xl font-black text-white shrink-0 border border-white/10">
                                    {player.playerName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black text-white truncate uppercase">{player.playerName}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{player.clubName}</p>
                                    {playerGroup && (
                                        <p className="text-[10px] text-violet-400 font-bold mt-1">{playerGroup.name}</p>
                                    )}

                                    <div className="grid grid-cols-3 gap-3 mt-6">
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Promedio</p>
                                            <p className="text-lg font-black text-emerald-400 tabular-nums">{player.average.toFixed(3)}</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Puntos</p>
                                            <p className="text-lg font-black text-white tabular-nums">{player.points}</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Serie</p>
                                            <p className="text-lg font-black text-violet-400 tabular-nums">{player.highRun}</p>
                                        </div>
                                    </div>

                                    {nextMatch && (
                                        <div className="mt-4 p-3 bg-violet-500/5 rounded-xl border border-violet-500/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                                <p className="text-[10px] font-black text-violet-300 uppercase tracking-widest">Próxima</p>
                                            </div>
                                            <p className="text-xs font-bold text-white uppercase">
                                                VS {nextMatch.homePlayerId === player.playerId ? nextMatch.awayPlayer?.lastName : nextMatch.homePlayer?.lastName}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Estados de carga / error ─────────────────────────────────────────────────

function LiveLoader() {
    return (
        <div className="h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] animate-pulse">Sintonizando Live Center...</p>
        </div>
    );
}

function LiveError() {
    return (
        <div className="h-screen bg-[#020617] flex items-center justify-center p-12">
            <div className="bg-rose-500/10 border border-rose-500/20 p-12 rounded-[3rem] text-center max-w-xl">
                <h2 className="text-3xl font-black text-rose-500 uppercase mb-4">Señal Interrumpida</h2>
                <p className="text-slate-400 font-medium">No se logró conectar con el Live Center. Intenta recargar en unos momentos.</p>
            </div>
        </div>
    );
}
