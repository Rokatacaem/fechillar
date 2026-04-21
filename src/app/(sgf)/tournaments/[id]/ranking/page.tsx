import React from "react";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Trophy, Users, Star } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { getTournamentStandings } from "@/lib/tournament-results";
import { CuadroHonor } from "@/components/tournaments/CuadroHonor";

export default async function TournamentRankingPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
    });

    if (!tournament) return notFound();

    const standingsData = await getTournamentStandings(tournamentId);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link
                        href={`/tournaments`}
                        className="p-4 rounded-2xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-xl"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                                Ranking <span className="text-emerald-500">Torneo</span>
                            </h1>
                            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Clasificación Final
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-2">
                             {tournament.name}
                        </p>
                    </div>
                </div>
            </div>

            {standingsData.length > 0 ? (
                <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl">
                    <CuadroHonor participants={standingsData} tournamentId={tournamentId} />
                </div>
            ) : (
                <div className="bg-slate-900/40 border border-white/5 p-24 rounded-[3rem] text-center backdrop-blur-3xl shadow-2xl">
                    <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                        <Trophy className="w-10 h-10 text-slate-600" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Sin posiciones finales</h2>
                    <p className="text-slate-500 max-w-sm mx-auto">El ranking se generará automáticamente una vez que el torneo finalice y se procesen todos los resultados.</p>
                </div>
            )}
        </div>
    );
}
