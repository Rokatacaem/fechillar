import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users, Trophy, MapPin } from "lucide-react";
import Link from "next/link";
import { InscritosListClient } from "@/components/tournaments/InscritosListClient";
import { auth } from "@/auth";
import TournamentPhaseNavigator from "@/components/tournament/TournamentPhaseNavigator";
import { calculatePhaseStates } from "@/lib/tournament/phase-manager";

export default async function TournamentRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;

    // Obtener torneo con partidos y grupos para el navegador de fases
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            hostClub: true,
            matches: {
                select: {
                    id: true,
                    round: true,
                    winnerId: true,
                    isWO: true,
                    groupId: true,
                }
            },
            groups: {
                select: { id: true }
            }
        }
    });

    if (!tournament) return notFound();

    // Calcular estado de todas las fases
    const phaseStates = calculatePhaseStates(
        tournament.matches as any,
        tournament.groups.length > 0
    );

    // Obtener inscritos con promedio de ranking
    const registrations = await prisma.tournamentRegistration.findMany({
        where: { tournamentId },
        orderBy: [
            { registeredPoints: 'desc' },
            { registeredAt: 'asc' }
        ],
        include: {
            player: {
                include: {
                    user: { select: { name: true } },
                    club: { select: { id: true, name: true } },
                    rankings: {
                        where: { discipline: tournament.discipline as any },
                        select: { average: true },
                        take: 1
                    }
                }
            }
        }
    });

    // Obtener todos los clubes para el ingreso masivo
    const allClubs = await prisma.club.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    });

    // Normalizar para el componente cliente
    const inscritosData = registrations.map(r => ({
        id: r.id,
        playerId: r.playerId, // Añadir playerId para validaciones en cliente
        status: r.status,
        paymentStatus: r.paymentStatus,
        amountPaid: r.amountPaid,
        paymentRef: r.paymentRef,
        registeredPoints: r.registeredPoints,
        preferredTurn: r.preferredTurn || "T1",
        rankingAverage: r.player.rankings?.[0]?.average ?? null,
        player: {
            user: r.player.user,
            firstName: r.player.firstName,
            lastName: r.player.lastName,
            rut: r.player.rut,
            federationId: r.player.federationId,
            club: r.player.club,
        }
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto pb-20">
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
                        INSCRIPCIONES <span className="text-emerald-500">TORNEO</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
                        Gestión de llave y participantes
                    </p>
                </div>
            </div>

            {/* Banner de Navegación de Fases */}
            <div className="animate-in slide-in-from-top duration-1000">
                <TournamentPhaseNavigator
                    tournamentId={tournamentId}
                    phases={phaseStates as any}
                />
            </div>

            {/* Header del Torneo */}
            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{tournament.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm font-medium">
                        <span className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-slate-500" />
                            {tournament.discipline} / {tournament.category}
                        </span>
                        <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-500" />
                            {tournament.hostClub ? tournament.hostClub.name : "Sede Central"}
                        </span>
                        <span className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            {registrations.length} Jugadores
                        </span>
                    </div>
                </div>
                
                <span className={[
                    "inline-flex items-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    tournament.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    tournament.status === 'UPCOMING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                    tournament.status === 'FINISHED' ? 'bg-emerald-900/30 text-emerald-600 border border-emerald-900/40' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                ].join(" ")}>
                    ESTADO: {tournament.status}
                </span>
            </div>

            {/* Padrón full-width */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-white">Padrón de Inscritos</h3>
                </div>

                <InscritosListClient 
                    registrations={inscritosData} 
                    tournamentId={tournamentId} 
                    allClubs={allClubs} 
                    hasGroups={tournament.groups.length > 0}
                    registrationFee={tournament.registrationFee || 30000}
                />
            </div>
        </div>
    );
}
