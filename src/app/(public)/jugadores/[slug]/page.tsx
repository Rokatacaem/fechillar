import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { MapPin, Trophy, Calendar, Medal, Activity, TrendingUp } from "lucide-react";
import ShareProfileButton from "@/components/public/ShareProfileButton";
import { PerformanceChart } from "@/components/player/PerformanceChart";
import { checkPlayerIsHighRun } from "@/lib/tournament-results";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const slugParams = await params;
    const profile = await prisma.playerProfile.findUnique({ 
        where: { slug: slugParams.slug },
        include: { 
            user: true,
            club: true,
            rankings: {
                orderBy: { points: 'desc' },
                take: 1
            }
        }
    });
    
    if (!profile) return { title: 'Jugador no encontrado | FECHILLAR' };

    const topRanking = profile.rankings[0];
    const rankingInfo = topRanking ? `- Ranking ${topRanking.discipline} (${topRanking.points} pts)` : '';
    const clubInfo = profile.club ? `representando a ${profile.club.name}` : 'Jugador Independiente';

    return {
        title: `Perfil de Billarista Profesional: ${profile.user.name} ${rankingInfo}`,
        description: `Consulta el perfil oficial de ${profile.user.name} en FECHILLAR. Historial de torneos, promedio PGP y logros ${clubInfo}.`,
        openGraph: {
            title: `${profile.user.name} - Ficha Oficial FECHILLAR`,
            description: `Rendimiento y estadísticas de ${profile.user.name} en el ecosistema nacional de billar.`,
            images: profile.photoUrl ? [profile.photoUrl] : []
        }
    };
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const slugParams = await params;
    const { slug } = slugParams;

    const player = await prisma.playerProfile.findUnique({
        where: { slug },
        include: {
            user: true,
            club: true,
            rankings: true,
            registrations: {
                where: { status: "APPROVED" },
                include: { tournament: true },
                orderBy: { tournament: { startDate: 'desc' } },
                take: 5
            }
        }
    });

    if (!player) return notFound();

    // Obtener los puntos más altos de sus categorías (usualmente Pool u otra disciplina principal)
    const topRanking = player.rankings.sort((a, b) => b.points - a.points)[0];
    const totalPoints = topRanking ? topRanking.points : 0;
    const rankTitle = topRanking ? `${topRanking.discipline} - ${topRanking.category}` : "NO CLASIFICADO";

    // Fase A: Analítica Visual de Progresión (PGP)
    const finishedRegistrations = player.registrations
        .filter(r => r.tournament.status === "FINISHED")
        .sort((a, b) => new Date(a.tournament.startDate).getTime() - new Date(b.tournament.startDate).getTime());

    const chartData = finishedRegistrations.map(r => ({
        name: r.tournament.name.split(' ')[0] + ' ' + new Date(r.tournament.startDate).getFullYear(), 
        points: r.registeredAverage || 0 // Usar PGP real del snapshot
    }));

    // Fase B: Extracción de Logros (Medallero)
    const achievements = [];
    for (const reg of player.registrations) {
        if (reg.tournament.status === "FINISHED") {
            if (reg.registeredRank === 1) {
                achievements.push({
                    title: `Campeón ${reg.tournament.name}`,
                    icon: "Trophy",
                    color: "text-yellow-500"
                });
            }
            
            // Verificar Mejor Tacada automáticamente
            const isHighRun = await checkPlayerIsHighRun(reg.tournamentId, player.id);
            if (isHighRun) {
                achievements.push({
                    title: `Mejor Tacada ${reg.tournament.name}`,
                    icon: "Zap",
                    color: "text-amber-500"
                });
            }
        }
    }

    const clubColor = player.club?.accentColor || "#10b981";

    return (
        <div className="bg-[#020817] min-h-screen pb-24 font-sans text-slate-300">
            {/* HERO DEL JUGADOR */}
            <header className="relative w-full max-w-5xl mx-auto mt-12 bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {/* Banner de Fondo del Club */}
                <div 
                    className="h-32 w-full opacity-60"
                    style={{ backgroundColor: player.club ? player.club.primaryColor : '#1e293b' }}
                />
                
                <div className="px-8 pb-8 relative flex flex-col md:flex-row items-center md:items-end md:justify-between gap-6 -mt-16">
                    {/* AVATAR Y DATOS PERSONALES */}
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden shadow-xl shrink-0 z-10">
                            {player.photoUrl ? (
                                <Image src={player.photoUrl} alt="📸" width={128} height={128} className="object-cover w-full h-full" />
                            ) : (
                                <span className="text-4xl font-black text-slate-400">
                                    {player.user.name?.substring(0,2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        
                        <div className="pt-4 md:pt-16">
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                                {player.user.name}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                                <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-sm">
                                    <MapPin className="w-4 h-4" />
                                    {player.club ? player.club.name : "Jugador Independiente"}
                                </span>
                                {player.federationId && (
                                    <span className="bg-white/10 border border-white/5 text-slate-300 px-3 py-1 rounded-full text-xs font-mono">
                                        ID: {player.federationId}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BOTÓN DE COMPARTIR Y MÉTRICA */}
                    <div className="flex flex-col items-center md:items-end gap-4 shrink-0 mt-4 md:mt-0">
                        <ShareProfileButton playerName={player.user.name || "Jugador"} />
                        
                        <div className="bg-[#020817] border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left">
                            <Trophy className="w-10 h-10 text-yellow-500" />
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{rankTitle}</p>
                                <p className="text-3xl font-black text-white font-mono leading-none">{totalPoints} PTS</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 mt-12 space-y-12">
                
                <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-xl font-bold text-white">Rendimiento Técnico (PGP)</h2>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Promedio General Ponderado
                        </div>
                    </div>
                    <PerformanceChart data={chartData} color={clubColor} label="PGP" />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* COLUMNA IZQUIERDA: HISTORIAL DEPARTAMENTAL */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <Activity className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-xl font-bold text-white">Historial de Competencias</h2>
                    </div>

                    {player.registrations.length === 0 ? (
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 text-center text-slate-500">
                            No registra historial oficial en torneos recientes.
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-black/30 text-xs font-black uppercase text-slate-500 tracking-widest border-b border-white/5">
                                        <th className="p-4 pl-6">Torneo</th>
                                        <th className="p-4 hidden sm:table-cell">Fecha</th>
                                        <th className="p-4">Categoría</th>
                                        <th className="p-4 text-right pr-6">Rendimiento Estimado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {player.registrations.map((reg) => (
                                        <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-white text-sm">{reg.tournament.name}</div>
                                                <div className="text-xs text-slate-500 mt-1 sm:hidden">
                                                    {new Date(reg.tournament.startDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 hidden sm:table-cell text-sm text-slate-400">
                                                <span className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-600" />
                                                    {new Date(reg.tournament.startDate).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded text-xs font-bold uppercase">
                                                    {reg.tournament.discipline}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                {/* Mostrar el puntaje con el que se inscribió o el ganado. Asumimos el base para UI historico simple */}
                                                <span className="font-mono text-emerald-400 font-black">+ {reg.registeredPoints}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA: ESTADÍSTICAS FRONTALES */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Medal className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-bold text-white">Medallero e Historial</h3>
                        </div>
                        
                        {achievements.length > 0 && (
                            <div className="space-y-3 mb-8">
                                {achievements.map((ach, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 group hover:bg-yellow-500/20 transition-all">
                                        <div className={`p-2 rounded-lg bg-black/40 ${ach.color}`}>
                                            {ach.icon === 'Trophy' ? <Trophy className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                        </div>
                                        <span className="text-xs font-black text-white uppercase tracking-tight leading-tight">
                                            {ach.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <ul className="space-y-4">
                            {player.rankings.length === 0 ? (
                                <li className="text-sm text-slate-500 text-center">Sin records.</li>
                            ) : (
                                player.rankings.map(r => (
                                    <li key={r.id} className="flex items-center justify-between border-b border-white/5 last:border-0 pb-3 last:pb-0">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{r.discipline}</span>
                                        <span className="font-mono font-bold text-white">{r.points} <span className="text-[10px] text-slate-500 font-sans">pts</span></span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                </div>
            </main>
        </div>
    );
}
