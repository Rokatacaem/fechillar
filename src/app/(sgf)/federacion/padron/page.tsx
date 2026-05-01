import { auth } from "@/auth";
import { getFederatedCensus } from "@/actions/census-actions";
import prisma from "@/lib/prisma";
import { getPlayerStanding } from "@/lib/standing";
import { PlayerTableActions } from "@/components/players/PlayerTableActions";
import { QuickValidateButton } from "./QuickValidateButton";
import { BulkActivateButton } from "@/components/players/BulkActivateButton";
import { DedupTool } from "@/components/admin/DedupTool";
import { RankingEditButton } from "@/components/admin/RankingEditButton";
import { Users, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

import { CensusSearch } from "./CensusSearch";

export default async function FederatedCensusPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string; club?: string }>
}) {
    const { q, club } = await searchParams;
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const managedClubId = (session?.user as any)?.managedClubId;
    const isSuper = ["SUPERADMIN", "FEDERATION_ADMIN"].includes(userRole);

    const players = await getFederatedCensus(q, club);
    const clubs = await prisma.club.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

    // Pre-procesar standings para evitar async en el render
    const playersWithStanding = await Promise.all(players.map(async (player) => {
        const lastMembership = (player.user?.memberships as any)?.[0] || null;
        const standing = await getPlayerStanding(player.userId || player.id, lastMembership);
        return { ...player, standing, lastMembership };
    }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 uppercase">
                        <Users className="w-10 h-10 text-emerald-500" />
                        PADRÓN <span className="text-emerald-500 underline decoration-4 underline-offset-8">FEDERADO</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                        Control Central de Membresías y Habilitación Competitiva
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-slate-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
                        <div className="px-6 py-2 border-r border-white/5 text-center">
                            <p className="text-2xl font-black text-white">{players.length}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Afiliados</p>
                        </div>
                        <div className="px-6 py-2 border-r border-white/5 text-center">
                            <p className="text-2xl font-black text-emerald-500">
                                {players.filter(p => (p.user?.memberships as any)?.[0]?.status === "PAID").length}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Habilitados</p>
                        </div>
                        <div className="px-6 py-2 text-center">
                            <p className="text-2xl font-black text-violet-400">
                                {players.filter(p => !p.userId).length}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Sin Cuenta</p>
                        </div>
                    </div>

                    {isSuper && <BulkActivateButton />}

                    <Link 
                        href="/federacion/padron/nuevo"
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-6 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] active:scale-95 text-xs uppercase tracking-tighter"
                    >
                        <Plus className="w-5 h-5" />
                        Incorporar Deportista
                    </Link>
                </div>
            </div>

            {/* BUSCADOR */}
            <CensusSearch clubs={clubs} />

            {/* Herramienta de deduplicación — solo superadmin */}
            {isSuper && <DedupTool />}

            {/* Main Table */}
            <div className="bg-[#020817] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/50 text-[10px] font-black uppercase text-slate-600 tracking-widest border-b border-white/5">
                            <th className="px-8 py-6">Jugador</th>
                            <th className="px-8 py-6">Club / RUT</th>
                            <th className="px-8 py-6">Estado Padrón</th>
                            <th className="px-8 py-6">Vencimiento</th>
                            <th className="px-8 py-6 text-right">Gestión</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {playersWithStanding.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No se encontraron deportistas</p>
                                </td>
                            </tr>
                        ) : (
                            playersWithStanding.map((player) => {
                                const { standing, lastMembership } = player;
                                const canEdit = isSuper || (player.club?.id === managedClubId);

                                const colorMap: Record<string, string> = {
                                    "emerald-500": "bg-emerald-500",
                                    "amber-500": "bg-amber-500",
                                    "rose-600": "bg-rose-600"
                                };

                                const textMap: Record<string, string> = {
                                    "emerald-500": "text-emerald-500",
                                    "amber-500": "text-amber-500",
                                    "rose-600": "text-rose-600"
                                };

                                const borderMap: Record<string, string> = {
                                    "emerald-500": "border-emerald-500/20",
                                    "amber-500": "border-amber-500/20",
                                    "rose-600": "border-rose-600/20"
                                };

                                const colorClass = colorMap[standing.color] || "bg-slate-500";
                                const textClass = textMap[standing.color] || "text-slate-500";
                                const borderClass = borderMap[standing.color] || "border-slate-500/20";

                                return (
                                    <tr key={player.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {player.photoUrl ? (
                                                        <img src={player.photoUrl} alt={player.user?.name || player.firstName || ""} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users className="w-5 h-5 text-slate-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white leading-tight uppercase tracking-tighter">
                                                        {player.user?.name || (player.firstName ? `${player.firstName} ${player.lastName}` : "SIN NOMBRE")}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 font-bold">{player.user?.email || player.email || "📧 SIN CORREO"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-black text-[var(--color-accent)] uppercase tracking-widest mb-1">
                                                {player.club?.name || "SIN CLUB"}
                                            </p>
                                            <p className="text-[10px] font-mono text-slate-600">{player.rut}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full animate-pulse ${colorClass}`} />
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase ${colorClass}/10 px-2 py-0.5 rounded-md ${textClass} border ${borderClass}`}>
                                                        {standing.status}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 mt-1 font-bold">{standing.message}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-black text-white">
                                                {lastMembership?.validUntil ? new Date(lastMembership.validUntil).toLocaleDateString() : "---"}
                                            </p>
                                            <p className="text-[9px] text-slate-500 uppercase font-black">Ciclo Anual</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link 
                                                    href={`/perfil/${player.publicSlug}`}
                                                    target="_blank"
                                                    className="p-2 bg-slate-900 border border-white/5 rounded-xl text-slate-500 hover:text-white transition-all active:scale-95"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                <RankingEditButton player={player} isSuper={isSuper} />
                                                <QuickValidateButton playerId={player.id} currentStatus={standing.status} />
                                                <PlayerTableActions 
                                                    player={{
                                                        id: player.id,
                                                        name: player.user?.name || `${player.firstName || ''} ${player.lastName || ''}`.trim() || "Sin Nombre",
                                                        email: player.user?.email || player.email || "",
                                                        rut: player.rut,
                                                        clubId: player.club?.id || null,
                                                        gender: player.gender,
                                                        photoUrl: player.photoUrl
                                                    }} 
                                                    canEdit={canEdit}
                                                    clubs={clubs}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
