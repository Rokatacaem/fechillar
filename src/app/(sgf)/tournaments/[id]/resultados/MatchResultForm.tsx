"use client";

import { useState, useEffect } from "react";
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
    allowDraws?: boolean;
    groupId?: string | null;
    existingResult?: {
        homeScore: number;
        awayScore: number;
        homeInnings: number;
        awayInnings: number;
        homeHighRun: number;
        awayHighRun: number;
        winnerId: string | null;
        refereeName?: string | null;
        isWO?: boolean;
        tossWinnerId?: string | null;
    } | null;
    onSaved?: () => void;
}

export function MatchResultForm({
    matchId,
    homePlayer,
    awayPlayer,
    inningLimit,
    allowDraws = true,
    groupId,
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
    const [isWO, setIsWO] = useState(existingResult?.isWO ?? false);
    const [tossWinnerId, setTossWinnerId] = useState<string | null>(existingResult?.tossWinnerId ?? null);

    // Lógica de Auto-Ganador (Nacional de Mayo)
    useEffect(() => {
        // Solo calculamos automáticamente si se han ingresado datos mínimos
        if (homeScore === 0 && awayScore === 0) return;
        if (isWO) return; // El WO tiene su propia lógica manual/semi-auto

        if (homeScore > awayScore) {
            setWinnerId(homePlayer.id);
        } else if (awayScore > homeScore) {
            setWinnerId(awayPlayer.id);
        } else if (homeScore === awayScore && homeScore > 0) {
            // Empate en carambolas: Decide el Arrime (Toss)
            if (tossWinnerId) {
                setWinnerId(tossWinnerId);
            }
        }
    }, [homeScore, awayScore, tossWinnerId, isWO, homePlayer.id, awayPlayer.id]);

    const handleSave = async () => {
        // Validar Ganador de Arrime (Obligatorio para el Nacional)
        if (!tossWinnerId) {
            toast.error("Debes seleccionar quién ganó el Arrime (Salida)");
            return;
        }

        // Validar si es un empate o si se seleccionó un ganador
        const isDraw = winnerId === null && homeScore === awayScore && homeScore > 0;
        
        if (winnerId === null && homeScore !== awayScore) {
            toast.error("Para un empate, los puntajes deben ser iguales");
            return;
        }

        if (!winnerId) {
            if (homeScore === awayScore) {
                // Si groupId es null y NO es un empate explícito, pedir ganador en eliminación directa
                if (!groupId && !allowDraws) {
                    toast.error("Los empates no están permitidos en eliminación directa");
                    return;
                }
                // Permitir empate (winnerId: null)
            } else {
                toast.error("Selecciona el ganador o marca empate");
                return;
            }
        }

        if (!isWO && (homeInnings <= 0 || awayInnings <= 0)) {
            toast.error("Las entradas deben ser mayores a 0");
            return;
        }

        setLoading(true);
        try {
            const data: MatchResultInput = {
                homeScore,
                awayScore,
                homeInnings,
                awayInnings,
                homeHighRun,
                awayHighRun,
                winnerId,
                refereeName,
                isWO,
                tossWinnerId,
            };

            const res = await saveMatchResult(matchId, data);
            
            if (res.success) {
                toast.success("Resultado guardado correctamente");
                setOpen(false);
                if (onSaved) onSaved();
            } else {
                toast.error(res.error || "Error al guardar en el servidor");
            }
        } catch (err) {
            toast.error("Error de conexión al guardar");
        } finally {
            setLoading(false);
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
                    
                    {/* Ganador de Arrime */}
                    <div className="space-y-2 py-4 border-y border-white/5">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest text-center">Ganador del Arrime (Salida)</p>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => setTossWinnerId(homePlayer.id)}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                    tossWinnerId === homePlayer.id 
                                    ? "bg-violet-500/10 border-violet-500/30 text-violet-400" 
                                    : "bg-slate-800/50 border-white/5 text-slate-500 hover:text-slate-300"
                                }`}
                            >
                                {homePlayer.name.split(" ")[0]}
                            </button>
                            <button
                                type="button"
                                onClick={() => setTossWinnerId(awayPlayer.id)}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                    tossWinnerId === awayPlayer.id 
                                    ? "bg-violet-500/10 border-violet-500/30 text-violet-400" 
                                    : "bg-slate-800/50 border-white/5 text-slate-500 hover:text-slate-300"
                                }`}
                            >
                                {awayPlayer.name.split(" ")[0]}
                            </button>
                        </div>
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

                        <div className="flex-1 space-y-2">
                             <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Opciones Especiales</p>
                             <button
                                onClick={() => {
                                    const nextWO = !isWO;
                                    setIsWO(nextWO);
                                    if (nextWO) {
                                        // Si es WO, pedimos quién ganó. Por defecto el home.
                                        if (!winnerId) setWinnerId(homePlayer.id);
                                        // Score reglamentario: 15-0 y 0 entradas (o 1)
                                        setHomeInnings(0);
                                        setAwayInnings(0);
                                        if (winnerId === homePlayer.id || !winnerId) {
                                            setHomeScore(15);
                                            setAwayScore(0);
                                        } else {
                                            setHomeScore(0);
                                            setAwayScore(15);
                                        }
                                    }
                                }}
                                className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    isWO ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-500 hover:text-white"
                                }`}
                             >
                                {isWO ? "Declarado Walkover (WO)" : "Declarar Walkover"}
                             </button>
                        </div>

                    {/* Selección de Ganador */}
                    <div className="space-y-2">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Resultado Final</p>
                        <div className={`grid gap-2 ${allowDraws ? "grid-cols-3" : "grid-cols-2"}`}>
                            <button
                                type="button"
                                onClick={() => !isWO && setWinnerId(homePlayer.id)}
                                disabled={!isWO && (homeScore !== awayScore || homeScore === 0)}
                                className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                                    winnerId === homePlayer.id
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                } ${!isWO && homeScore !== awayScore ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                Gana {homePlayer.name.split(" ")[0]}
                            </button>
                            
                            {allowDraws && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setWinnerId(null);
                                        // Auto-igualar puntajes si el usuario marca empate y son distintos de 0 pero desiguales
                                        if (homeScore !== awayScore && homeScore > 0) {
                                            setAwayScore(homeScore);
                                        } else if (homeScore !== awayScore && awayScore > 0) {
                                            setHomeScore(awayScore);
                                        }
                                    }}
                                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                                        winnerId === null
                                            ? "bg-slate-600 text-white"
                                            : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                    }`}
                                >
                                    Empate
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => !isWO && setWinnerId(awayPlayer.id)}
                                disabled={!isWO && (homeScore !== awayScore || homeScore === 0)}
                                className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                                    winnerId === awayPlayer.id
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                } ${!isWO && homeScore !== awayScore ? "opacity-50 cursor-not-allowed" : ""}`}
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
