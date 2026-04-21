"use client";

import { useState } from "react";
import { Trophy, Loader2, AlertTriangle, CheckCircle, ChevronDown, X } from "lucide-react";
import { commitTournamentRanking } from "./actions";
import { toast } from "sonner";

interface CloseTournamentButtonProps {
    tournamentId: string;
    isNational: boolean;
    isApproved: boolean;
    pendingMatches: number;
}

export function CloseTournamentButton({
    tournamentId,
    isNational,
    isApproved,
    pendingMatches,
}: CloseTournamentButtonProps) {
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);

    const handleClose = async () => {
        if (!confirmed) { setConfirmed(true); return; }
        setLoading(true);
        setConfirmed(false);

        // forceNational=true para torneos nacionales históricos aunque no estén formalmente APPROVED
        const res = await commitTournamentRanking(tournamentId, isNational);
        setLoading(false);

        if (res.success) {
            setResult(res);
            toast.success(res.message ?? "Torneo cerrado");
        } else {
            toast.error(res.error ?? "Error al cerrar el torneo");
        }
    };

    if (result) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Torneo Cerrado</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{result.message}</p>
                    </div>
                </div>
                {result.applyNational && (
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <p className="text-[10px] text-violet-300 font-bold">
                            {result.rankingsUpdated} jugadores actualizados en el Ranking Nacional
                        </p>
                    </div>
                )}
                <button
                    onClick={() => setShowDetail(!showDetail)}
                    className="text-[9px] text-slate-500 underline flex items-center gap-1"
                >
                    Ver clasificación <ChevronDown className={`w-3 h-3 transition-transform ${showDetail ? "rotate-180" : ""}`} />
                </button>
                {showDetail && (
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="text-slate-600 font-black uppercase">
                                <th className="text-left pb-1">Pos</th>
                                <th className="text-right pb-1">Puntos Match</th>
                                <th className="text-right pb-1">Promedio</th>
                                {result.applyNational && <th className="text-right pb-1">Pts Nac.</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {result.standings.map((s: any) => (
                                <tr key={s.playerId}>
                                    <td className="py-1 font-black text-white">#{s.position}</td>
                                    <td className="py-1 text-right text-slate-300">{s.points}</td>
                                    <td className="py-1 text-right text-slate-300">{s.average}</td>
                                    {result.applyNational && <td className="py-1 text-right text-violet-400 font-black">+{s.nationalPoints}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        );
    }

    if (confirmed) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                        <p className="text-xs font-black text-amber-400 uppercase tracking-widest">¿Cerrar y publicar resultados?</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {isNational
                                ? "Los puntos se acreditarán al Ranking Nacional de cada jugador. Esta acción no se puede deshacer."
                                : "El torneo quedará como FINISHED. Los puntos solo aplican a la clasificación interna."}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirmar Cierre"}
                    </button>
                    <button
                        onClick={() => setConfirmed(false)}
                        className="px-4 py-2.5 bg-slate-800 text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={handleClose}
            disabled={pendingMatches > 0}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_20px_-5px_rgba(124,58,237,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 border-0"
        >
            <Trophy className="w-4 h-4" />
            {pendingMatches > 0
                ? `${pendingMatches} partidas sin resultado`
                : "Cerrar Torneo y Publicar Rankings"
            }
        </button>
    );
}
