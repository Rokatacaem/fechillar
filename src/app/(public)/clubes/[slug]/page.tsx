import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Trophy, CalendarPlus, Users } from "lucide-react";
import ClubRankingTable from "@/components/public/ClubRankingTable";
import Link from "next/link";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const slugParams = await params;
    const club = await prisma.club.findUnique({ where: { slug: slugParams.slug } });
    
    if (!club) return { title: 'Club no encontrado' };

    return {
        title: `${club.name} | AutoLink`,
        openGraph: {
            images: club.logoUrl ? [club.logoUrl] : []
        }
    };
}

export default async function PublicClubPage({ params }: { params: Promise<{ slug: string }> }) {
    const slugParams = await params;
    const { slug } = slugParams;

    const club = await prisma.club.findUnique({
        where: { slug }
    });

    if (!club) return notFound();

    // Obtener Torneos donde el club es Sede
    const upcomingTournaments = await prisma.tournament.findMany({
        where: { tenantId: club.id },
        orderBy: { startDate: 'asc' }
    });

    return (
        <div className="bg-[#020817] min-h-screen pb-24 font-sans text-slate-300">
            {/* HERO HEADER */}
            <header 
                className="relative h-72 md:h-96 flex items-end justify-between border-b"
                style={{ 
                    borderColor: club.primaryColor,
                    background: `linear-gradient(to top, #020817 10%, ${club.primaryColor}80 100%)` 
                }}
            >
                <div className="absolute inset-0 z-0 bg-black/40" />
                <div className="relative z-10 p-8 md:p-16 w-full max-w-7xl mx-auto flex items-end justify-between gap-6">
                    <div className="flex gap-6 items-center">
                        <div 
                            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center font-black text-4xl shadow-xl"
                            style={{ backgroundColor: club.primaryColor, color: club.secondaryColor, border: `2px solid ${club.secondaryColor}`}}
                        >
                            {club.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">{club.name}</h1>
                            <p className="text-lg text-slate-300 mt-2 font-medium tracking-wide">Sala de Billar Oficial FECHILLAR</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-16 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-8">
                
                {/* COLUMNA IZQUIERDA: RANKING LOCAL */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <Trophy className="w-8 h-8 text-emerald-500" />
                        <h2 className="text-2xl font-black text-white">Ranking Interno del Club</h2>
                    </div>
                    {/* Tabla Extraída como Componente Servidor o Mixto */}
                    <ClubRankingTable clubId={club.id} secondaryColor={club.secondaryColor} />
                </div>

                {/* COLUMNA DERECHA: TORNEOS Y ESTADÍSTICAS */}
                <div className="space-y-12">
                    <section>
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                            <CalendarPlus className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-bold text-white">Próximos Torneos</h2>
                        </div>
                        {upcomingTournaments.length === 0 ? (
                            <div className="bg-slate-900 border border-white/5 rounded-xl p-6 text-center">
                                <p className="text-sm text-slate-500">No hay eventos programados en esta sede próximamente.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingTournaments.map(t => (
                                    <div key={t.id} className="bg-slate-900 border border-white/10 rounded-xl p-4 transition-colors relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${t.status === 'OPEN' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                                        <h3 className="font-bold text-white pl-3">{t.name}</h3>
                                        <p className="text-xs text-slate-400 pl-3 uppercase tracking-wider mt-1 mb-3">{t.category} - {t.discipline}</p>
                                        
                                        {t.status === 'OPEN' && (
                                            <Link href={`/tournaments/${t.id}/inscripciones`} className="block text-center text-[10px] font-black tracking-widest bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/50 text-indigo-400 py-2 rounded-lg transition-all ml-3">
                                                INSCRIPCIONES
                                            </Link>
                                        )}
                                        {(t.status === 'IN_PROGRESS' || t.status === 'FINISHED') && (
                                            <Link href={`/tournaments/${t.id}/cuadros`} className="block text-center text-[10px] font-black tracking-widest bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/50 text-emerald-400 py-2 rounded-lg transition-all ml-3">
                                                VER CUADROS
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="w-6 h-6 text-slate-400" />
                            <h2 className="text-lg font-bold text-white">Ficha Técnica</h2>
                        </div>
                        <ul className="space-y-4 text-sm font-mono text-slate-400">
                            <li className="flex justify-between border-b border-white/5 pb-2">
                                <span>CIUDAD</span>
                                <span className="text-white">{club.city || "No registrada"}</span>
                            </li>
                            <li className="flex justify-between border-b border-white/5 pb-2">
                                <span>DIRECCIÓN</span>
                                <span className="text-white">{club.address || "No registrada"}</span>
                            </li>
                            <li className="flex justify-between pb-2">
                                <span>ESTADO</span>
                                <span className="text-emerald-400 font-bold">ACTIVO</span>
                            </li>
                        </ul>
                    </section>
                </div>
            </main>
        </div>
    );
}
