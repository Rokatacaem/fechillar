"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { submitMatchResult } from "@/app/(sgf)/tournaments/matchmaking/actions";
import { useRouter } from "next/navigation";

interface MatchEditorProps {
    matchId: string;
    hasWinner: boolean;
    isWO: boolean;
    homeScore: number | null;
    awayScore: number | null;
}

export function MatchScoreEditor({ matchId, hasWinner, isWO, homeScore, awayScore }: MatchEditorProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleInput = async () => {
        if (isWO) {
            alert("Este partido fue ganado por Pase Directo (W.O). No necesita marcador.");
            return;
        }

        const hScoreStr = window.prompt("Puntaje JUGADOR CASA (Arriba):", "15");
        if (hScoreStr === null) return;
        
        const aScoreStr = window.prompt("Puntaje JUGADOR VISITANTE (Abajo):", "8");
        if (aScoreStr === null) return;

        const home = parseInt(hScoreStr);
        const away = parseInt(aScoreStr);

        if (isNaN(home) || isNaN(away)) {
            alert("Los puntajes deben ser numéricos.");
            return;
        }

        if (home === away) {
            alert("En esta disciplina no se admiten empates.");
            return;
        }

        setLoading(true);
        try {
            const res = await submitMatchResult(matchId, home, away);
            if (res.success) {
                router.refresh();
            } else {
                alert(res.error);
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    if (hasWinner) {
        return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 pointer-events-none opacity-20">
                 <span className="text-emerald-500 font-black text-2xl uppercase tracking-widest border-4 border-emerald-500 p-1 px-3">CERRADO</span>
            </div>
        );
    }

    return (
        <button 
            onClick={handleInput}
            disabled={loading}
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-emerald-600 border border-white/10 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all z-10 shadow-lg group-hover:scale-110"
            title="Ingresar Resultado"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <span className="text-xs font-bold font-mono">VS</span>}
        </button>
    );
}
