"use client";

import React, { useState } from "react";
import { useTournamentLive } from "@/hooks/use-tournament-live";
import { Trophy, Users, ListOrdered, Play, Activity, Star, Calendar, Search, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LiveGeneralRanking } from "../public/LiveGeneralRanking";

interface Props {
    tournamentId: string;
}

export function TournamentLiveView({ tournamentId }: Props) {
    const { data, isLoading, error } = useTournamentLive(tournamentId, 15000);
    const [activeTab, setActiveTab] = useState<"overview" | "groups" | "brackets" | "stats">("stats");
    const [searchTerm, setSearchTerm] = useState("");

    if (isLoading) return <LiveLoader />;
    if (error || !data) return <LiveError />;

    const tournament = data.tournament as any;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-violet-500/30">
            {/* Header Hero */}
            <div className="relative h-[40vh] overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-600/20 to-[#020617] z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                
                <div className="relative z-20 h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-12">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-violet-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">En Vivo</span>
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
                            {tournament.discipline}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4 leading-none">
                        {tournament.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold text-sm">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-400" /> {format(new Date(tournament.startDate), "PPP", { locale: es })}</span>
                        <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-violet-400" /> {tournament.category}</span>
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-violet-400" /> {tournament.registrations?.length || 0} Atletas</span>
                    </div>

                    {/* Quick Search Bar */}
                    <div className="mt-8 max-w-md w-full relative">
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

            {/* Navigation Tabs */}
            <div className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-8 h-16">
                    {[
                        { id: "overview", label: "Vista General", icon: Activity },
                        { id: "groups", label: "Fase de Grupos", icon: ListOrdered },
                        { id: "brackets", label: "Cuadro Final", icon: Trophy },
                        { id: "stats", label: "Estadísticas", icon: Star },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 h-full border-b-2 transition-all text-xs font-black uppercase tracking-widest ${
                                activeTab === tab.id 
                                ? "border-violet-500 text-white" 
                                : "border-transparent text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
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
                        {activeTab === "groups" && <GroupsView data={data} />}
                        {activeTab === "brackets" && <BracketsView data={data} />}
                        {activeTab === "stats" && <StatsView data={data} />}
                    </>
                )}
            </main>
        </div>
    );
}

function Overview({ data }: { data: any }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
                {/* Partidas en curso */}
                <section>
                    <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                        <Play className="w-6 h-6 text-emerald-500 fill-emerald-500" /> Partidas en Curso
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {data.matches?.filter((m: any) => m.status === "PLAYING").map((match: any) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                        {data.matches?.filter((m: any) => m.status === "PLAYING").length === 0 && (
                            <div className="p-12 border-2 border-dashed border-white/5 rounded-[2rem] text-center">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Esperando inicio de partidas...</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Resultados Recientes */}
                <section>
                    <h2 className="text-2xl font-black text-white mb-6">Resultados Recientes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.matches?.filter((m: any) => m.status === "FINISHED").slice(0, 4).map((match: any) => (
                            <MatchCardSmall key={match.id} match={match} />
                        ))}
                    </div>
                </section>
            </div>

            <aside className="space-y-12">
                {/* Líderes de Rendimiento */}
                <section className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-violet-400 mb-6 flex items-center gap-2">
                        <Star className="w-4 h-4" /> Top Performers
                    </h3>
                    <div className="space-y-6">
                        {data.topPerformers?.byAverage?.slice(0, 5).map((p: any, i: number) => (
                            <div key={p.playerId} className="flex items-center gap-4">
                                <span className="text-xs font-black text-slate-700 w-4">{i + 1}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white truncate">{p.playerName}</p>
                                    <p className="text-[10px] text-slate-500 font-medium truncate uppercase">{p.clubName}</p>
                                </div>
                                <span className="text-sm font-black text-emerald-400 tabular-nums">{p.average.toFixed(3)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </aside>
        </div>
    );
}

function MatchCard({ match }: { match: any }) {
    return (
        <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
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
                    <div className="bg-white/10 text-white text-[10px] font-black px-2 py-1 rounded-lg border border-white/5 mb-4">
                        VS
                    </div>
                    <div className="text-4xl font-black tabular-nums tracking-tighter text-violet-400 flex items-center gap-2">
                        <span>{match.homeScore ?? 0}</span>
                        <span className="text-slate-800">-</span>
                        <span>{match.awayScore ?? 0}</span>
                    </div>
                    <div className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
        <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:bg-slate-900/40 transition-all">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-bold ${match.winnerId === match.homePlayerId ? 'text-white' : 'text-slate-500'}`}>
                        {match.homePlayer?.lastName}
                    </span>
                    <span className={`text-xs font-black tabular-nums ${match.winnerId === match.homePlayerId ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {match.homeScore}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${match.winnerId === match.awayPlayerId ? 'text-white' : 'text-slate-500'}`}>
                        {match.awayPlayer?.lastName}
                    </span>
                    <span className={`text-xs font-black tabular-nums ${match.winnerId === match.awayPlayerId ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {match.awayScore}
                    </span>
                </div>
            </div>
            <div className="ml-6 pl-6 border-l border-white/5 text-right">
                <p className="text-[10px] font-black text-slate-600 uppercase">{match.refereeName || 'Mesa 1'}</p>
                <p className="text-[9px] text-slate-700 font-bold uppercase mt-1">{match.homeInnings} ENT.</p>
            </div>
        </div>
    );
}

function GroupsView({ data }: { data: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.groups?.map((group: any) => (
                <div key={group.id} className="bg-slate-900/40 border border-white/10 rounded-[2rem] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-violet-400">{group.name}</h3>
                    </div>
                    <div className="p-2 divide-y divide-white/5">
                        {group.registrations?.map((reg: any, i: number) => (
                            <div key={reg.id} className="px-4 py-3 flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-700">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{reg.player?.firstName} {reg.player?.lastName}</p>
                                    <p className="text-[9px] text-slate-500 font-medium truncate uppercase tracking-tighter">{reg.player?.club?.name}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-emerald-400 tabular-nums">{reg.player?.rankings?.[0]?.average?.toFixed(3) || "0.000"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function BracketsView({ data }: { data: any }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center border border-violet-500/20">
                <Trophy className="w-10 h-10 text-violet-500" />
            </div>
            <div>
                <h3 className="text-2xl font-black text-white">Cuadro Eliminatorio</h3>
                <p className="text-slate-500 font-medium mt-2">La fase final se habilitará al concluir la fase de grupos.</p>
            </div>
        </div>
    );
}

function StatsView({ data }: { data: any }) {
    return (
        <div className="py-8">
            <LiveGeneralRanking standings={data.allStandings || []} />
        </div>
    );
}

function SearchResults({ searchTerm, groups, allStandings, matches }: any) {
    const s = searchTerm.toLowerCase();
    
    // Buscar jugadores
    const results = allStandings?.filter((p: any) => 
        p.playerName.toLowerCase().includes(s) || 
        p.clubName.toLowerCase().includes(s)
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
            <h2 className="text-xl font-black text-white mb-8">Resultados para "{searchTerm}"</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((player: any) => {
                    const playerGroup = groups.find((g: any) => g.standings.some((st: any) => st.playerId === player.playerId));
                    // Extraer Turno del nombre del grupo "Grupo X (T1)"
                    const turnMatch = playerGroup?.name.match(/\((T\d)\)/);
                    const turn = turnMatch ? turnMatch[1] : "N/A";
                    
                    const nextMatch = matches.find((m: any) => 
                        (m.homePlayerId === player.playerId || m.awayPlayerId === player.playerId) && 
                        m.status === "PENDING"
                    );

                    return (
                        <div key={player.playerId} className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8">
                                <div className="bg-violet-500/10 text-violet-400 px-4 py-2 rounded-2xl border border-violet-500/20 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Bloque {turn}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-2xl font-black text-white shrink-0 border border-white/10">
                                    {player.playerName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-2xl font-black text-white truncate leading-tight uppercase">{player.playerName}</h3>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{player.clubName}</p>
                                    
                                    <div className="grid grid-cols-3 gap-4 mt-8">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Promedio</p>
                                            <p className="text-xl font-black text-emerald-400 tabular-nums">{player.average.toFixed(3)}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Mesa</p>
                                            <p className="text-xl font-black text-white flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-violet-400" />
                                                {playerGroup?.id.slice(-1) || "1"} 
                                            </p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Puntos</p>
                                            <p className="text-xl font-black text-white tabular-nums">{player.points}</p>
                                        </div>
                                    </div>

                                    {nextMatch && (
                                        <div className="mt-6 p-4 bg-violet-500/5 rounded-2xl border border-violet-500/10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                                <p className="text-[10px] font-black text-violet-300 uppercase tracking-widest">Próxima Partida</p>
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
