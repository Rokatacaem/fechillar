import React from "react";
import Link from "next/link";
import { Trophy, Plus, MapPin, Calendar, Users, Pencil, FileText } from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { DeleteTournamentButton } from "@/components/admin/DeleteTournamentButton";

export default async function TournamentsListPage() {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const canCreate = ["SUPERADMIN", "FEDERATION_ADMIN", "CLUB_DELEGATE"].includes(userRole);
    const isAdmin = ["SUPERADMIN", "FEDERATION_ADMIN"].includes(userRole);

    const tournaments = await prisma.tournament.findMany({
        orderBy: { startDate: "asc" }, // Prioridad por fecha para calendario oficial
        include: {
            hostClub: true,
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

                {canCreate && (
                    <Link
                        href="/tournaments/nuevo"
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        NUEVO TORNEO
                    </Link>
                )}
            </div>

            {!hasTournaments ? (
                /* Empty State Dark Pro */
                <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 border-2 border-dashed border-white/5 rounded-3xl backdrop-blur-md">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 animate-pulse">
                        <Trophy className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No hay torneos activos</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm">
                        El calendario de competencias está vacío. Los administradores oficiales cargarán los torneos nacionales al inicio de la temporada.
                    </p>
                    {canCreate && (
                        <Link
                            href="/tournaments/nuevo"
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-8 py-4 rounded-xl font-bold transition-all border border-emerald-500/20 shadow-xl shadow-emerald-500/5"
                        >
                            <Plus className="w-5 h-5" />
                            CREAR PRIMER TORNEO
                        </Link>
                    )}
                </div>
            ) : (
                /* Grid de Torneos */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tournaments.map((tournament) => (
                        <div 
                            key={tournament.id} 
                            className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all"
                        >
                            {/* Link de capa completa para navegación principal */}
                            <Link 
                                href={`/tournaments/${tournament.id}/cuadros`}
                                className="absolute inset-0 z-0"
                            />

                            {/* Decoration Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
                            
                            <div className="flex items-start justify-between mb-4 relative z-20">
                                {tournament.scope === "NATIONAL" ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        Nacional
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Interno ({tournament.hostClub?.name || "Club"})
                                    </span>
                                )}
                                
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                        tournament.status === 'OPEN' ? 'text-emerald-400' : 
                                        tournament.status === 'DRAFT' ? 'text-slate-500' : 
                                        tournament.status === 'FINISHED' ? 'text-emerald-500' : 'text-yellow-500'
                                    }`}>
                                        {tournament.status}
                                    </span>
                                    {isAdmin && (
                                        <>
                                            <Link
                                                href={`/tournaments/${tournament.id}/editar`}
                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
                                                title="Editar configuración del torneo"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Link>
                                            <DeleteTournamentButton tournamentId={tournament.id} tournamentName={tournament.name} />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="relative z-10 pointer-events-none">
                                <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors">
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

                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 tracking-widest group-hover:translate-x-1 transition-transform pointer-events-none">
                                    Ver Detalles <Plus className="w-3 h-3" />
                                </div>
                                <div className="flex items-center gap-2 pointer-events-auto">
                                    {isAdmin && tournament.status !== "FINISHED" && (
                                        <>
                                            <Link 
                                                href={`/tournaments/${tournament.id}/documentos`}
                                                className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] font-black uppercase text-indigo-400 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5"
                                            >
                                                <FileText className="w-3 h-3" /> Documentos
                                            </Link>
                                            <Link 
                                                href={`/tournaments/${tournament.id}/inscripciones`}
                                                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                                            >
                                                <Users className="w-3 h-3" /> Inscritos
                                            </Link>
                                            <Link 
                                                href={`/tournaments/${tournament.id}/grupos`}
                                                className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3 h-3" /> Grupos
                                            </Link>
                                            <Link 
                                                href={`/tournaments/${tournament.id}/resultados`}
                                                className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-[9px] font-black uppercase text-violet-400 hover:bg-violet-500/20 transition-colors flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3 h-3" /> Resultados
                                            </Link>
                                        </>
                                    )}
                                    <Link 
                                        href={`/tournaments/${tournament.id}/ranking`}
                                        className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase text-amber-500 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
                                    >
                                        <Trophy className="w-3 h-3" /> Ranking
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
