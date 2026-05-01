import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, IdCard, Shield, Calendar, Award } from "lucide-react";
import { PlayerPhotoEdition } from "@/components/players/PlayerPhotoEdition";

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const player = await prisma.playerProfile.findUnique({
        where: { id },
        include: {
            user: true,
            club: true,
            rankings: true,
        }
    });

    if (!player) {
        notFound();
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
            {/* Nav */}
            <div className="flex items-center">
                <Link href="/players" className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-xl">
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Jugadores
                </Link>
            </div>

            {/* Carnet Digital */}
            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2rem] backdrop-blur-md shadow-2xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                    {/* Foto Interactiva */}
                    <PlayerPhotoEdition 
                        playerId={player.id} 
                        playerName={player.user?.name || "Deportista"} 
                        initialPhotoUrl={player.photoUrl} 
                    />

                    {/* Datos */}
                    <div className="flex-1 space-y-6 text-center md:text-left w-full">
                        <div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                                Nivel Federado
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter leading-none">
                                {[player.firstName, player.lastName].filter(Boolean).join(' ') || player.user?.name || "Sin Nombre"}
                            </h1>
                            <p className="text-slate-500 font-mono text-lg mt-2">
                                {player.rut || "Sin RUT"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 justify-center md:justify-start">
                                    <Shield className="w-3 h-3" /> Club
                                </span>
                                <p className="text-sm font-medium text-white truncate px-1">{player.club?.name || "Agente Libre"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 justify-center md:justify-start">
                                    <Award className="w-3 h-3" /> Género
                                </span>
                                <p className="text-sm font-medium text-white">{player.gender === "M" ? "Masculino" : player.gender === "F" ? "Femenino" : "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 justify-center md:justify-start">
                                    <Calendar className="w-3 h-3" /> Ingreso
                                </span>
                                <p className="text-sm font-medium text-white">
                                    {player.createdAt.toLocaleDateString('es-CL')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 justify-center md:justify-start">
                                    <IdCard className="w-3 h-3" /> Licencia
                                </span>
                                <p className="text-sm font-medium text-emerald-400">Activa</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ficha Técnica Extra (Placeholder para Rankings/Métricas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
                    <h3 className="text-lg font-bold text-white mb-4">Rankings Actuales</h3>
                    {player.rankings.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No hay registros de ranking aún.</p>
                    ) : (
                        <div className="space-y-4">
                             {player.rankings.map(r => {
                                 const isAnnual = r.discipline === 'THREE_BAND_ANNUAL';
                                 const label = isAnnual ? 'Ranking Anual' : r.discipline === 'THREE_BAND' ? 'Ranking Nacional' : r.discipline;
                                 const accentColor = isAnnual ? 'blue' : 'emerald';

                                 return (
                                     <div key={r.id} className="bg-slate-950 rounded-xl border border-white/5 overflow-hidden">
                                         {/* Header del ranking */}
                                         <div className={`px-4 py-2 border-b border-white/5 flex items-center justify-between bg-${accentColor}-500/5`}>
                                             <span className={`text-xs font-bold uppercase tracking-widest text-${accentColor}-400`}>
                                                 {label}
                                             </span>
                                             <span className="text-[10px] text-slate-500 uppercase">{r.category}</span>
                                         </div>
                                         {/* Métricas */}
                                         <div className={`grid ${isAnnual ? 'grid-cols-3' : 'grid-cols-4'} gap-px bg-white/5`}>
                                             <div className="bg-slate-950 p-3 text-center">
                                                 <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Posición</p>
                                                 <p className={`text-xl font-extrabold text-${accentColor}-400`}>
                                                     {r.rankPosition ? `#${r.rankPosition}` : '-'}
                                                 </p>
                                             </div>
                                             <div className="bg-slate-950 p-3 text-center">
                                                 <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Promedio</p>
                                                 <p className="text-xl font-extrabold text-white font-mono">
                                                     {r.average != null ? r.average.toFixed(3) : '-'}
                                                 </p>
                                             </div>
                                             {!isAnnual && (
                                                 <div className="bg-slate-950 p-3 text-center">
                                                     <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Handicap</p>
                                                     <p className="text-xl font-extrabold text-amber-400">
                                                         {r.handicapTarget ?? '-'}
                                                     </p>
                                                 </div>
                                             )}
                                             <div className="bg-slate-950 p-3 text-center">
                                                 <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Puntos</p>
                                                 <p className="text-xl font-extrabold text-white">
                                                     {r.points}
                                                 </p>
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                    )}
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
                    <h3 className="text-lg font-bold text-white mb-4">Próximos Torneos</h3>
                    <p className="text-sm text-slate-500 italic">No hay inscripciones activas.</p>
                </div>
            </div>
        </div>
    );
}
