"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useTournamentLive } from "@/hooks/use-tournament-live";
import { AutoRotationContainer } from "@/components/public/AutoRotationContainer";
import { Loader2 } from "lucide-react";

export default function TournamentStreamingPage() {
    const params = useParams();
    const tournamentId = params.id as string;

    // Intervalo de 10s para Streaming (Aggressive polling)
    const { data, isLoading, error } = useTournamentLive(tournamentId, 10000);

    if (isLoading && !data) {
        return (
            <div className="h-screen bg-[#020817] flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] animate-pulse">Sintonizando Señal...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-screen bg-[#020817] flex items-center justify-center p-12">
                <div className="bg-rose-500/10 border border-rose-500/20 p-12 rounded-[3rem] text-center max-w-xl">
                    <h2 className="text-3xl font-black text-rose-500 uppercase mb-4">Señal Interrumpida</h2>
                    <p className="text-slate-400 font-medium">No se logró conectar con el motor de resultados. Verifica el ID del torneo o contacta al soporte técnico.</p>
                </div>
            </div>
        );
    }

    return (
        <AutoRotationContainer 
            tournament={data.tournament}
            groups={data.groups}
            matches={data.matches}
            topPerformers={data.topPerformers}
            rotationInterval={45000} // Aprobado: 45 segundos
        />
    );
}
