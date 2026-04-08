import React from "react";
import Link from "next/link";
import { Trophy, Plus, MapPin, Calendar, Users } from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export default async function TournamentsListPage() {
    // 1. Fetch de torneos. Si el sistema aplica aislamiento en prisma.ts, 
    //    filtra automáticamente los scopes que correspondan para el tenantId actual.
    //    Los FEDERATION_ADMIN verán todos.
    const tournaments = await prisma.tournament.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            hostClub: true, // Para ver de qué club son los INTERNAL
            creator: {
                select: { name: true }
            }
        }
    });

    const hasTournaments = tournaments.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 h-full flex flex-col">
            {/* Header Administrativo */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                        GESTIÓN DE <span className="text-emerald-500">TORNEOS</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
                        Competencias oficiales de la Federación y Clubes
                    </p>
                </div>

                <Link
                    href="/tournaments/nuevo"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    NUEVO TORNEO
                </Link>
            </div>

            {!hasTournaments ? (
                /* Empty State Dark Pro */
                <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 border-2 border-dashed border-white/5 rounded-3xl backdrop-blur-md">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 animate-pulse">
                        <Trophy className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No hay torneos activos</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm">
                        El calendario de competencias está vacío. Crea el primer torneo para empezar a gestionar categorías, inscripciones y el ranking de jugadores.
                    </p>
                    <Link
                        href="/tournaments/nuevo"
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-8 py-4 rounded-xl font-bold transition-all border border-emerald-500/20 shadow-xl shadow-emerald-500/5"
                    >
                        <Plus className="w-5 h-5" />
                        CREAR PRIMER TORNEO
                    </Link>
                </div>
            ) : (
                /* Grid de Torneos */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tournaments.map((tournament) => (
                        <div key={tournament.id} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-white/10 transition-colors">
                            {/* Decoration Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                {tournament.scope === "NATIONAL" ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        Nacional
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Interno ({tournament.hostClub?.name || "Club"})
                                    </span>
                                )}
                                
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                    tournament.status === 'OPEN' ? 'text-emerald-400' : 
                                    tournament.status === 'DRAFT' ? 'text-slate-500' : 'text-yellow-500'
                                }`}>
                                    {tournament.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                                {tournament.name}
                            </h3>
                            
                            <div className="space-y-2 mt-6">
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Trophy className="w-4 h-4 text-slate-500" />
                                    <span>{tournament.discipline} / {tournament.category}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    <span>
                                        {tournament.startDate.toLocaleDateString("es-CL")} 
                                        {tournament.endDate && ` - ${tournament.endDate.toLocaleDateString("es-CL")}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <MapPin className="w-4 h-4 text-slate-500" />
                                    <span>Creado por: {tournament.creator?.name || "Admin"}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
