import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { UserPlus, Search, Trophy } from "lucide-react";

export default async function PlayersListPage() {
    // 1. Traemos los jugadores reales de la DB
    const players = await prisma.playerProfile.findMany({
        include: { club: true, user: true },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Administrativo */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                        GESTIÓN DE <span className="text-emerald-500">JUGADORES</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
                        {players.length} Afiliados registrados en la base de datos
                    </p>
                </div>

                <Link
                    href="/players/nuevo"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    REGISTRAR NUEVO
                </Link>
            </div>

            {/* Tabla de Jugadores Pro */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jugador</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">RUT</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Club Actual</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {players.map((player) => (
                            <tr key={player.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                                            {player.photoUrl ? (
                                                <img src={player.photoUrl} alt={player.user?.name || ""} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                                                    {(player.user?.name || "U")[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-none">
                                                {player.user?.name || "Sin Nombre"}
                                            </p>
                                            <span className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-tighter">Nivel Federado</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-slate-400">{player.rut}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {player.club?.name || "Sin Club"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/players/${player.id}`} className="inline-block text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg active:scale-95">
                                        Detalles
                                    </Link>
                                </td>
                            </tr>
                        ))}

                        {players.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center">
                                    <p className="text-slate-500 italic">No hay jugadores registrados aún.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}