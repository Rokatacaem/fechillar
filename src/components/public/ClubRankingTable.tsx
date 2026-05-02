import React from "react";
import prisma from "@/lib/prisma";
import Image from "next/image";

export default async function ClubRankingTable({ clubId, secondaryColor }: { clubId: string, secondaryColor: string }) {
    // Buscar todos los rankings que pertenecen a jugadores de este club
    const rankings = await prisma.ranking.findMany({
        where: { player: { tenantId: clubId } },
        include: { player: { include: { user: true } } },
        orderBy: { points: 'desc' }
    });

    if (rankings.length === 0) {
        return (
            <div className="bg-slate-900 border border-white/5 p-12 text-center rounded-2xl">
                <p className="text-slate-500 font-bold">Aún no hay jugadores de este club con puntaje en la matriz nacional.</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                    <tr className="bg-black/40 border-b border-white/10 text-xs font-black uppercase text-slate-500 tracking-widest">
                        <th className="p-4 pl-6 w-16">Pos</th>
                        <th className="p-4">Jugador</th>
                        <th className="p-4 hidden sm:table-cell">Categoría</th>
                        <th className="p-4 text-right pr-6">Puntaje</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {rankings.map((rk, idx) => (
                        <tr key={rk.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-4 pl-6">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    {idx + 1}
                                </div>
                            </td>
                            <td className="p-4 font-bold text-white flex items-center gap-3">
                                {rk.player.photoUrl ? (
                                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-white/10">
                                        <Image src={rk.player.photoUrl} alt="Avatar" width={40} height={40} className="object-cover w-full h-full" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-xs" style={{ backgroundColor: secondaryColor, color: '#fff' }}>
                                        {rk.player.user?.name?.substring(0,2).toUpperCase() || "??"}
                                    </div>
                                )}
                                <span className="group-hover:text-emerald-400 transition-colors">
                                    {rk.player.user?.name || "Jugador Provisional"}
                                </span>
                            </td>
                            <td className="p-4 hidden sm:table-cell text-sm text-slate-400 font-medium">
                                {rk.discipline} / {rk.category}
                            </td>
                            <td className="p-4 text-right pr-6 font-mono font-black text-lg text-emerald-400">
                                {rk.points}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
