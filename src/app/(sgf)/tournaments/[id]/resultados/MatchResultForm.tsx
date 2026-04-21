"use client";

import { useState } from "react";
import { Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { saveMatchResult, MatchResultInput } from "./actions";
import { toast } from "sonner";

interface Player {
    id: string;
    name: string;
    club?: string;
}

interface MatchResultFormProps {
    matchId: string;
    homePlayer: Player;
    awayPlayer: Player;
    inningLimit: number;
    existingResult?: {
        homeScore: number;
        awayScore: number;
        homeInnings: number;
        awayInnings: number;
        homeHighRun: number;
        awayHighRun: number;
        winnerId: string | null;
        refereeName?: string | null;
    } | null;
    onSaved?: () => void;
}

export function MatchResultForm({
    matchId,
    homePlayer,
    awayPlayer,
    inningLimit,
    existingResult,
    onSaved,
}: MatchResultFormProps) {
    const [open, setOpen] = useState(!existingResult);
    const [loading, setLoading] = useState(false);

    const [homeScore, setHomeScore] = useState(existingResult?.homeScore ?? 0);
    const [awayScore, setAwayScore] = useState(existingResult?.awayScore ?? 0);
    const [homeInnings, setHomeInnings] = useState(existingResult?.homeInnings ?? inningLimit);
    const [awayInnings, setAwayInnings] = useState(existingResult?.awayInnings ?? inningLimit);
    const [homeHighRun, setHomeHighRun] = useState(existingResult?.homeHighRun ?? 0);
    const [awayHighRun, setAwayHighRun] = useState(existingResult?.awayHighRun ?? 0);
    const [winnerId, setWinnerId] = useState<string | null>(existingResult?.winnerId ?? null);
    const [refereeName, setRefereeName] = useState(existingResult?.refereeName ?? "");

    const handleSave = async () => {
        if (!winnerId && homeScore === awayScore) {
            // Permitir empate si no hay winnerId y puntajes iguales
        } else if (!winnerId) {
            toast.error("Selecciona el ganador o marca empate");
            return;
        }

        setLoading(true);
        const data: MatchResultInput = {
            homeScore,
            awayScore,
            homeInnings,
            awayInnings,
            homeHighRun,
            awayHighRun,
            winnerId,
            refereeName,
        };

        const res = await saveMatchResult(matchId, data);
        setLoading(false);

        if (res.success) {
            toast.success("Resultado guardado");
            setOpen(false);
            onSaved?.();
        } else {
            toast.error(res.error ?? "Error al guardar");
        }
    };

    const isComplete = existingResult != null;

    return (
        <div className={`rounded-2xl border transition-all ${
            isComplete
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-white/5 bg-slate-900/40"
        }`}>
            {/* Header / Resumen */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Home */}
                    <div className="text-right flex-1 min-w-0">
                        <p className="text-xs font-black text-white uppercase truncate">{homePlayer.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{homePlayer.club}</p>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2 shrink-0">
                        {isComplete ? (
                            <>
                                <span className={`text-xl font-black w-8 text-center ${existingResult?.winnerId === homePlayer.id ? "text-emerald-400" : "text-slate-400"}`}>
                                    {existingResult?.homeScore}
                                </span>
                                <span className="text-slate-600 font-black">vs</span>
                                <span className={`text-xl font-black w-8 text-center ${existingResult?.winnerId === awayPlayer.id ? "text-emerald-400" : "text-slate-400"}`}>
                                    {existingResult?.awayScore}
                                </span>
                            </>
                        ) : (
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest px-3">
                                Sin resultado
                            </span>
                        )}
                    </div>

                    {/* Away */}
                    <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-black text-white uppercase truncate">{awayPlayer.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{awayPlayer.club}</p>
                    </div>
                </div>

                <div className="ml-4 shrink-0">
                    {isComplete
                        ? <Check className="w-4 h-4 text-emerald-500" />
                        : open
                            ? <ChevronUp className="w-4 h-4 text-slate-500" />
                            : <ChevronDown className="w-4 h-4 text-slate-500" />
                    }
                </div>
            </button>

            {/* Form expandible */}
            {open && (
                <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                    {/* Grid de estadísticas */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                        {/* Labels */}
                        <p className="text-[9px] text-center text-slate-500 font-black uppercase tracking-widest col-start-1">{homePlayer.name.split(" ")[0]}</p>
                        <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest"> </p>
                        <p className="text-[9px] text-center text-slate-500 font-black uppercase tracking-widest">{awayPlayer.name.split(" ")[0]}</p>

                        {/* Carambolas */}
                        <input type="number" min={0} value={homeScore}
                            onChange={e => setHomeScore(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white text-center text-lg font-black outline-none focus:ring-1 focus:ring-emerald-500/50"
                        />
                        <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest whitespace-nowrap px-1">Caramb.</p>
                        <input type="number" min={0} value={awayScore}
                            onChange={e => setAwayScore(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white text-center text-lg font-black outline-none focus:ring-1 focus:ring-emerald-500/50"
                        />

                        {/* Entradas */}
                        <input type="number" min={1} value={homeInnings}
                            onChange={e => setHomeInnings(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-center text-sm font-bold outline-none focus:ring-1 focus:ring-slate-500/50"
                        />
                        <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest whitespace-nowrap px-1">Entradas</p>
                        <input type="number" min={1} value={awayInnings}
                            onChange={e => setAwayInnings(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-center text-sm font-bold outline-none focus:ring-1 focus:ring-slate-500/50"
                        />

                        {/* Serie Mayor */}
                        <input type="number" min={0} value={homeHighRun}
                            onChange={e => setHomeHighRun(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-center text-sm font-bold outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                        <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest whitespace-nowrap px-1">S. Mayor</p>
                        <input type="number" min={0} value={awayHighRun}
                            onChange={e => setAwayHighRun(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-center text-sm font-bold outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                    </div>

                    {/* Árbitro del Partido */}
                    <div className="space-y-2">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Árbitro del Partido</p>
                        <input 
                            type="text" 
                            value={refereeName}
                            onChange={e => setRefereeName(e.target.value)}
                            placeholder="Nombre del juez / árbitro..."
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-slate-700"
                        />
                    </div>

                    {/* Selección de Ganador */}
                    <div className="space-y-2">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Resultado Final</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setWinnerId(homePlayer.id)}
                                className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                                    winnerId === homePlayer.id
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                }`}
                            >
                                Gana {homePlayer.name.split(" ")[0]}
                            </button>
                            <button
                                type="button"
                                onClick={() => setWinnerId(null)}
                                className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                                    winnerId === null
                                        ? "bg-slate-600 text-white"
                                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                }`}
                            >
                                Empate
                            </button>
                            <button
                                type="button"
                                onClick={() => setWinnerId(awayPlayer.id)}
                                className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                                    winnerId === awayPlayer.id
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                }`}
                            >
                                Gana {awayPlayer.name.split(" ")[0]}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Guardar Resultado
                    </button>
                </div>
            )}
        </div>
    );
}
