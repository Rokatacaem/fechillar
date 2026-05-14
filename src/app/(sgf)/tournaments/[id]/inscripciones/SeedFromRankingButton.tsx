"use client";

import { useState } from "react";
import { Trophy, Loader2, Users, AlertTriangle, CheckCircle, X } from "lucide-react";
import { seedFromNationalRanking } from "@/app/(sgf)/tournaments/inscripciones/actions";
import { toast } from "sonner";

interface Props {
    tournamentId: string;
    rankedCount: number;
    alreadyRegistered: number;
}

export function SeedFromRankingButton({ tournamentId, rankedCount, alreadyRegistered }: Props) {
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [seeded, setSeeded] = useState(0);

    const pending = rankedCount - alreadyRegistered;

    const handleSeed = async () => {
        if (!confirmed) { setConfirmed(true); return; }
        setLoading(true);
        setConfirmed(false);
        const res = await seedFromNationalRanking(tournamentId);
        setLoading(false);
        if (res.success) {
            setSeeded(res.count ?? 0);
            setDone(true);
            toast.success(res.message ?? "Jugadores sembrados");
        } else {
            toast.error(res.error ?? "Error al sembrar jugadores");
        }
    };

    if (done) {
        return (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Siembra completada</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{seeded} jugadores inscritos desde el Ranking Nacional</p>
                </div>
            </div>
        );
    }

    if (confirmed) {
        return (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                        <p className="text-xs font-black text-amber-400 uppercase tracking-widest">¿Confirmar siembra?</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            Se inscribirán <span className="text-white font-bold">{pending}</span> jugadores del Ranking Nacional,
                            ordenados por posición. Los datos de ranking quedan congelados al momento de la inscripción.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirmar"}
                    </button>
                    <button
                        onClick={() => setConfirmed(false)}
                        className="px-4 py-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
                <div className="bg-violet-500/20 p-2 rounded-xl">
                    <Trophy className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-black text-violet-300 uppercase tracking-widest">Torneo Master Anual</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        Siembra automática desde el Ranking Nacional
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black text-white">{rankedCount}</p>
                    <p className="text-[9px] text-slate-500 uppercase">rankeados</p>
                </div>
            </div>

            {alreadyRegistered > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Users className="w-3 h-3" />
                    <span>{alreadyRegistered} ya inscritos · {pending} pendientes</span>
                </div>
            )}

            <button
                onClick={handleSeed}
                disabled={pending === 0}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_-5px_rgba(124,58,237,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <Users className="w-3.5 h-3.5" />
                {pending === 0 ? "Todos los rankeados ya están inscritos" : `Sembrar ${pending} jugadores del Ranking Nacional`}
            </button>
        </div>
    );
}
