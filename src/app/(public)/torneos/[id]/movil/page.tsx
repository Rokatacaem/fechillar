"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTournamentLive } from "@/hooks/use-tournament-live";
import { MobileSwipeInterface } from "@/components/public/MobileSwipeInterface";
import { WhiteLabelProvider } from "@/components/providers/WhiteLabelProvider";
import { HighRunFlash } from "@/components/public/HighRunFlash";
import { Loader2 } from "lucide-react";

export default function TournamentMobilePage() {
    const params = useParams();
    const tournamentId = params.id as string;

    // Estado para detectar nuevos récords de High Run
    const [currentRecord, setCurrentRecord] = useState<number>(0);
    const [recordBreaker, setRecordBreaker] = useState<{ name: string; value: number } | null>(null);

    // Intervalo de 20s para Mobile
    const { data, isLoading, error } = useTournamentLive(tournamentId, 20000);

    // Lógica para disparar el HighRunFlash
    useEffect(() => {
        if (data?.topPerformers?.byHighRun?.[0]) {
            const topHR = data.topPerformers.byHighRun[0];

            // Si el valor recibido es mayor que lo que hemos visto antes (y no es el inicio)
            if (currentRecord > 0 && topHR.highRun > currentRecord) {
                setRecordBreaker({ name: topHR.playerName, value: topHR.highRun });
            }

            // Actualizar el récord local
            if (topHR.highRun > currentRecord) {
                setCurrentRecord(topHR.highRun);
            }
        }
    }, [data, currentRecord]);

    if (isLoading && !data) {
        return (
            <div className="h-screen bg-[#020817] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">Cargando Fan Zone...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-screen bg-[#020817] flex flex-col items-center justify-center p-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-rose-500/20 border-t-rose-500" />
                </div>
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-tighter">Torneo no disponible</h2>
                <p className="text-slate-500 text-xs text-center max-w-xs uppercase font-bold tracking-widest leading-relaxed">
                    No pudimos conectar con los servidores de FECHILLAR. Intenta recargar.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-8 py-3 bg-slate-900 border border-white/5 rounded-full text-white text-[10px] font-black uppercase tracking-widest"
                >
                    Recargar
                </button>
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
            <MobileSwipeInterface
                tournament={data.tournament}
                groups={data.groups || []} // ✅ FIX APLICADO
                matches={data.matches || []} // ✅ SEGURO EXTRA
                topPerformers={data.topPerformers}
            />

            {/* Flash de Récord para el Fan (Mobile) */}
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