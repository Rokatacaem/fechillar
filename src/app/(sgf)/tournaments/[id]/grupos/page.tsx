import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Users, Trophy, MapPin, Shuffle } from "lucide-react";
import { getGroupsWithPlayers } from "./actions";
import { GroupsEditor } from "./GroupsEditor";

export default async function GruposPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: tournamentId } = await params;
    const session = await auth();
    const role = (session?.user as any)?.role;
    const isAdmin = ["SUPERADMIN", "FEDERATION_ADMIN"].includes(role);

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { hostClub: true }
    });
    if (!tournament) return notFound();

    const { groups, unassigned } = await getGroupsWithPlayers(tournamentId);
    const totalRegistered = await prisma.tournamentRegistration.count({
        where: { tournamentId, status: "APPROVED" }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
            {/* Nav */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/tournaments/${tournamentId}/inscripciones`}
                    className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                        FASE DE <span className="text-violet-400">GRUPOS</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
                        Distribución y ajuste manual de llaves
                    </p>
                </div>
            </div>

            {/* Header torneo */}
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-3xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">{tournament.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm mt-1">
                        <span className="flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-slate-500" />
                            {tournament.discipline} / {tournament.category}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            {totalRegistered} jugadores · {groups.length} grupos
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                    {groups.length === 0 ? (
                        <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                            Sin grupos generados
                        </span>
                    ) : (
                        <span className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl">
                            {groups.length} grupos activos
                        </span>
                    )}
                </div>
            </div>

            {/* Editor interactivo */}
            <GroupsEditor
                tournamentId={tournamentId}
                groups={groups as any}
                unassigned={unassigned as any}
                isAdmin={isAdmin}
            />
        </div>
    );
}
