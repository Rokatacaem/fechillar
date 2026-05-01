import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ShareReportClient } from "./ShareReportClient";
import { getGroupsWithPlayers } from "../grupos/actions";

export default async function TournamentReportPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { id: true, name: true }
    });

    if (!tournament) return notFound();

    // Usar la función robusta (SQL) para obtener los grupos y jugadores
    const { groups } = await getGroupsWithPlayers(tournamentId);

    // Agrupar grupos por horario (basado en el nombre o el bloque al que pertenecen)
    // En el nuevo sistema, los grupos 1-6 son T1, 7-12 son T2, 13-18 son T3
    const turns: Record<string, any[]> = {
        "10:00 hrs (T1)": groups.filter(g => g.order >= 1 && g.order <= 6),
        "13:00 hrs (T2)": groups.filter(g => g.order >= 7 && g.order <= 12),
        "18:00 hrs (T3)": groups.filter(g => g.order >= 13 && g.order <= 18),
    };

    // Si hay grupos fuera de estos rangos, los ponemos en "Otros"
    const otherGroups = groups.filter(g => g.order < 1 || g.order > 18);
    if (otherGroups.length > 0) {
        turns["Otros Grupos"] = otherGroups;
    }

    // Limpiar turnos vacíos
    const filteredTurns = Object.fromEntries(
        Object.entries(turns).filter(([_, groups]) => groups.length > 0)
    );

    return (
        <div className="min-h-screen bg-[#020617] text-white p-4 pb-20">
            {/* Header */}
            <div className="max-w-md mx-auto mb-6 flex items-center justify-between">
                <Link href={`/tournaments/${tournamentId}/grupos`} className="p-2 bg-slate-900 rounded-full border border-white/5">
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </Link>
                <div className="text-center">
                    <h1 className="text-lg font-black tracking-tighter uppercase">Reporte de Grupos</h1>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{tournament.name}</p>
                </div>
                <div className="w-9" /> {/* Spacer */}
            </div>

            {/* Client Component for Interactivity */}
            <ShareReportClient 
                tournamentName={tournament.name}
                turns={filteredTurns as any}
            />
        </div>
    );
}
