import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { TournamentEditForm } from "./TournamentEditForm";
import { getAllClubs } from "./actions";

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!["SUPERADMIN", "FEDERATION_ADMIN"].includes(role)) {
        return notFound();
    }

    const [tournament, clubs] = await Promise.all([
        prisma.tournament.findUnique({
            where: { id },
            include: { hostClub: true }
        }),
        getAllClubs()
    ]);

    if (!tournament) return notFound();

    const config = (tournament.config as any) ?? {};

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-3xl mx-auto">
            {/* Nav */}
            <div className="flex items-center gap-4">
                <Link
                    href="/tournaments"
                    className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                        EDITAR <span className="text-amber-400">TORNEO</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
                        Configuración y parámetros
                    </p>
                </div>
            </div>

            <TournamentEditForm
                tournamentId={id}
                initialData={{
                    name: tournament.name,
                    description: tournament.description ?? "",
                    location: tournament.location ?? "",
                    startDate: tournament.startDate.toISOString().split("T")[0],
                    endDate: tournament.endDate?.toISOString().split("T")[0] ?? "",
                    status: tournament.status,
                    scope: tournament.scope,
                    discipline: tournament.discipline,
                    category: tournament.category,
                    tenantId: tournament.tenantId ?? "",
                    maxTables: tournament.maxTables,
                    hasTimeLimit: tournament.hasTimeLimit,
                    secondsPerShot: tournament.secondsPerShot,
                    // Config JSON
                    groupSize: config?.groups?.size ?? 4,
                    advancingCount: config?.groups?.advance ?? 2,
                    inningsPerPhase: config?.inningsPerPhase ?? 30,
                    playerCount: config?.playerCount ?? 32,
                    hasHandicap: config?.hasHandicap ?? false,
                }}
                clubs={clubs}
            />
        </div>
    );
}
