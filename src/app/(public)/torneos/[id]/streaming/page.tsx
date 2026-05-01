"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTournamentLive } from "@/hooks/use-tournament-live";
import { AutoRotationContainer } from "@/components/public/AutoRotationContainer";
import { WhiteLabelProvider } from "@/components/providers/WhiteLabelProvider";
import { HighRunFlash } from "@/components/public/HighRunFlash";
import { Loader2 } from "lucide-react";

export default function TournamentStreamingPage() {
    const params = useParams();
    const tournamentId = params.id as string;

    // Estado para detectar nuevos récords de High Run
    const [currentRecord, setCurrentRecord] = useState<number>(0);
    const [recordBreaker, setRecordBreaker] = useState<{ name: string; value: number } | null>(null);

    // Intervalo de 10s para Streaming
    const { data, isLoading, error } = useTournamentLive(tournamentId, 10000);

    // Lógica para disparar el HighRunFlash
    useEffect(() => {
        if (data?.topPerformers?.byHighRun?.[0]) {
            const topHR = data.topPerformers.byHighRun[0];

            // Si el valor recibido es mayor que lo que hemos visto antes (y no es el inicio)
            if (currentRecord > 0 && topHR.highRun > currentRecord) {
                setRecordBreaker({ name: topHR.playerName, value: topHR.highRun });
            }

            // Actualizar el récord local si es mayor
            if (topHR.highRun > currentRecord) {
                setCurrentRecord(topHR.highRun);
            }
        }
    }, [data, currentRecord]);

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

    const hostClub = (data.tournament as any)?.hostClub;

    return (
        <WhiteLabelProvider config={{
            brandColor: hostClub?.brandColor || "#0ea5e9",
            accentColor: hostClub?.accentColor || "#10b981",
            logoUrl: hostClub?.logoUrl || ""
        }}>
            {/* Contenedor Principal */}
            <AutoRotationContainer
                tournament={data.tournament}
                groups={data.groups || []} // ✅ FIX APLICADO
                matches={data.matches || []} // ✅ FIX APLICADO
                topPerformers={data.topPerformers || { byAverage: [], byHighRun: [] }} // ✅ FIX APLICADO
                allStandings={(data as any).allStandings || []}
                rotationInterval={45000}
                clubLogo={hostClub?.logoUrl || ""}
            />

            {/* Flash de Récord (Overlay) */}
            {recordBreaker && (
                <HighRunFlash
                    playerName={recordBreaker.name}
                    runValue={recordBreaker.value}
                    onComplete={() => setRecordBreaker(null)}
                />
            )}
        </WhiteLabelProvider>
    );
}