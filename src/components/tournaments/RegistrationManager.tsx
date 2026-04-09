"use client";

import React, { useState } from "react";
import { PlayerSearch } from "@/components/tournaments/PlayerSearch";
import { registerPlayer } from "@/app/(sgf)/tournaments/inscripciones/actions";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function RegistrationManager({ tournamentId }: { tournamentId: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSelect = async (player: any) => {
        if (!player) return;
        setLoading(true);
        setError(null);
        
        try {
            const res = await registerPlayer(tournamentId, player.id);
            if (res.success) {
                router.refresh(); // Actualiza la lista del servidor
            } else {
                setError(res.error || "Error desconocido");
            }
        } catch (e: any) {
             setError(e.message || "Fallo de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                Añadir Participante
            </h3>
            
            <div className="relative">
                <PlayerSearch onSelect={handleSelect} />
            </div>

            {loading && (
                <p className="mt-3 text-emerald-500 text-xs flex items-center gap-1 font-bold">
                     <Loader2 className="w-3 h-3 animate-spin"/> Procesando inscripción...
                </p>
            )}
            {error && (
                <p className="mt-3 text-red-500 text-xs font-bold">{error}</p>
            )}
        </div>
    );
}
