import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users, Trophy, MapPin, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { RegistrationManager } from "@/components/tournaments/RegistrationManager";
import { PaymentValidateButton } from "@/components/tournaments/PaymentValidateButton";
import { auth } from "@/auth";

export default async function TournamentRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;

    // Obtener torneo
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            hostClub: true,
        }
    });

    if (!tournament) return notFound();

    // Obtener inscritos
    const registrations = await prisma.tournamentRegistration.findMany({
        where: { tournamentId },
        orderBy: { registeredAt: 'desc' },
        include: {
            player: {
                include: {
                    user: true,
                    club: true
                }
            }
        }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
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
                
                <span className={\`inline-flex items-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest \${
                    tournament.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    tournament.status === 'UPCOMING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }\`}>
                    ESTADO: {tournament.status}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                     {/* Manager para buscar e inscribir */}
                     <RegistrationManager tournamentId={tournamentId} />
                </div>

                <div className="lg:col-span-2">
                    {/* Lista de Registrados */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-500" />
                                Padrón de Inscritos
                            </h3>
                        </div>

                        {registrations.length === 0 ? (
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 text-sm">Aún no hay jugadores inscritos en este torneo.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {registrations.map(reg => (
                                    <div key={reg.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10 shrink-0">
                                                {reg.player.user.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm">{reg.player.user.name}</p>
                                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                                                    {reg.player.club?.name || "JUGADOR LIBRE"} • RUT {reg.player.rut}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            {/* Modulo Financiero  */}
                                            <div className="text-right border-r border-white/5 pr-6 hidden md:block">
                                                {reg.paymentStatus === 'PAID' ? (
                                                    <div>
                                                        <p className="text-emerald-400 font-black text-sm">
                                                            {reg.amountPaid ? new Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(reg.amountPaid) : 'PAGADO'}
                                                        </p>
                                                        <p className="text-[9px] uppercase tracking-widest text-slate-500">Ref: {reg.paymentRef}</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <p className="text-yellow-500 font-bold text-sm">PENDIENTE</p>
                                                        <PaymentValidateButton registrationId={reg.id} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-right hidden sm:block">
                                                <p className="text-white font-black text-sm">{reg.registeredPoints}</p>
                                                <p className="text-[9px] uppercase tracking-widest text-slate-500">Puntos Rank.</p>
                                            </div>
                                            
                                            {reg.status === 'APPROVED' ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-yellow-500" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
