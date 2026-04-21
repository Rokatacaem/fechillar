"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MatchState, MatchEventType, applyEvent, saveMatchState, restoreMatchState, initMatch, Discipline, DISCIPLINE_RULES } from "@/lib/billiards/engine";
import { NetworkStatusBadge } from "@/hooks/useNetworkStatus";

const POOL_DISCIPLINES = [Discipline.POOL_8, Discipline.POOL_9, Discipline.POOL_10];

/**
 * Scoreboard de Pool para tótem de 21.5".
 * Muestra Racks, Break indicator, Faltas y Shot Clock.
 * Con persistencia LocalStorage para autonomía nómada.
 */
export default function PoolScoreboard({ params }: { params: { id: string } }) {
    const matchId = params.id;
    const discipline = Discipline.POOL_9; // En producción, se leerá de la BD

    const [state, setState] = useState<MatchState>(() => {
        // 1. Intentar recuperar desde cache (resiliencia ante reinicios)
        const restored = restoreMatchState(matchId);
        return restored ?? initMatch(matchId, discipline, { racksToWin: 7 });
    });

    const [clock, setClock] = useState(30);
    const [isCritical, setIsCritical] = useState(false);
    const [lastRackWinner, setLastRackWinner] = useState<"HOME" | "AWAY" | null>(null);

    // Persistencia Automática en cada cambio de estado
    useEffect(() => {
        saveMatchState(state);
    }, [state]);

    // Shot Clock de Pool (30s)
    useEffect(() => {
        const timer = setInterval(() => {
            setClock(prev => {
                const next = prev > 0 ? prev - 1 : 0;
                setIsCritical(next <= 8);
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [state.activeTurn]);

    const resetClock = () => { setClock(30); setIsCritical(false); };

    const registerScore = useCallback((actor: "HOME" | "AWAY") => {
        setState(s => applyEvent(s, { type: MatchEventType.SCORE, actor, timestamp: Date.now() }));
        resetClock();
    }, []);

    const registerMiss = useCallback((actor: "HOME" | "AWAY") => {
        setState(s => applyEvent(s, { type: MatchEventType.MISS, actor, timestamp: Date.now() }));
        resetClock();
    }, []);

    const registerFoul = useCallback((actor: "HOME" | "AWAY") => {
        setState(s => applyEvent(s, { type: MatchEventType.FOUL, actor, timestamp: Date.now() }));
        resetClock();
    }, []);

    const registerRackWin = useCallback((actor: "HOME" | "AWAY") => {
        setLastRackWinner(actor);
        setTimeout(() => setLastRackWinner(null), 2500);
        setState(s => applyEvent(s, { type: MatchEventType.RACK_WIN, actor, timestamp: Date.now() }));
        resetClock();
    }, []);

    const rules = DISCIPLINE_RULES[discipline];
    const maxRacks = rules.racksToWin ?? 0;

    return (
        <div className="w-screen h-screen bg-[#080c14] overflow-hidden select-none font-sans flex flex-col">

            {/* HEADER: Disciplina + Reloj de Mesa */}
            <div className="h-14 bg-[#0b1120] border-b border-slate-800 flex items-center justify-between px-8">
                <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                    {discipline.replace("_", " ")} — Mesa {matchId.slice(-4).toUpperCase()}
                </span>
                <span className="text-slate-500 text-xs font-mono">{new Date().toLocaleTimeString()}</span>
            </div>

            {/* RACKS SCOREBOARD */}
            <div className="flex flex-1 relative">

                {/* JUGADOR LOCAL */}
                <div className="flex-1 flex flex-col items-center justify-center gap-6 border-r border-slate-800 p-6 relative">
                    {state.breakTurn === "HOME" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-8 left-8 flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-full text-xs font-bold"
                        >
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                            SAQUE
                        </motion.div>
                    )}
                    {state.activeTurn === "HOME" && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-r-full" />
                    )}

                    <h2 className="text-3xl font-black text-white tracking-wide uppercase">Carlos S.</h2>

                    {/* Racks Ganados */}
                    <div className="flex gap-3">
                        {Array.from({ length: maxRacks }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-black ${i < state.homeRacks ? 'bg-emerald-500 border-emerald-400 text-slate-900' : 'border-slate-700 text-slate-700'}`}
                            >
                                {i < state.homeRacks ? "✓" : ""}
                            </motion.div>
                        ))}
                    </div>

                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={state.homeRacks}
                            initial={{ scale: 0.5, opacity: 0, y: -30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            className="text-[9rem] font-black text-white leading-none tabular-nums"
                        >
                            {state.homeRacks}
                        </motion.div>
                    </AnimatePresence>

                    {/* Faltas Consecutivas */}
                    {state.homeConsecutiveFouls > 0 && (
                        <div className="flex gap-1 mt-2">
                            {Array.from({ length: rules.maxConsecutiveFouls }).map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${i < state.homeConsecutiveFouls ? 'bg-rose-500' : 'bg-slate-800'}`} />
                            ))}
                            <span className="text-rose-400 text-xs font-bold ml-2">{state.homeConsecutiveFouls} FALTA(S)</span>
                        </div>
                    )}

                    {/* Botones Árbitro */}
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => registerRackWin("HOME")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-8 rounded-2xl text-xl transition-all active:scale-95 shadow-lg">
                            + RACK
                        </button>
                        <button onClick={() => registerFoul("HOME")} className="bg-rose-900/60 hover:bg-rose-800 text-rose-300 font-black py-4 px-5 rounded-2xl text-sm transition-all active:scale-95 border border-rose-900">
                            FALTA
                        </button>
                    </div>
                </div>

                {/* CENTRO: Reloj + Stats */}
                <div className="w-48 flex flex-col items-center justify-center gap-4 bg-[#0b1120] border-x border-slate-800 px-4">
                    <div className={`text-7xl font-black font-mono tabular-nums ${isCritical ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                        {clock.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">seg/tiro</div>

                    {/* Barra Shot Clock */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            animate={{ width: `${(clock / 30) * 100}%` }}
                            transition={{ ease: "linear", duration: 0.95 }}
                        />
                    </div>

                    <div className="text-center mt-4">
                        <div className="text-xs text-slate-500 uppercase tracking-widest">Entrada</div>
                        <div className="text-2xl font-black text-slate-300">{state.innings}</div>
                    </div>
                    
                    <button onClick={resetClock} className="text-xs text-slate-500 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-lg transition">
                        RESET CLOCK
                    </button>
                </div>

                {/* JUGADOR VISITANTE */}
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 relative">
                    {state.breakTurn === "AWAY" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-8 right-8 flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-full text-xs font-bold"
                        >
                            SAQUE
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                        </motion.div>
                    )}
                    {state.activeTurn === "AWAY" && (
                        <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500 rounded-l-full" />
                    )}

                    <h2 className="text-3xl font-black text-white tracking-wide uppercase">Daniel M.</h2>

                    <div className="flex gap-3">
                        {Array.from({ length: maxRacks }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-black ${i < state.awayRacks ? 'bg-indigo-500 border-indigo-400 text-slate-900' : 'border-slate-700 text-slate-700'}`}
                            >
                                {i < state.awayRacks ? "✓" : ""}
                            </motion.div>
                        ))}
                    </div>

                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={state.awayRacks}
                            initial={{ scale: 0.5, opacity: 0, y: -30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            className="text-[9rem] font-black text-white leading-none tabular-nums"
                        >
                            {state.awayRacks}
                        </motion.div>
                    </AnimatePresence>

                    {state.awayConsecutiveFouls > 0 && (
                        <div className="flex gap-1 mt-2">
                            <span className="text-rose-400 text-xs font-bold mr-2">{state.awayConsecutiveFouls} FALTA(S)</span>
                            {Array.from({ length: rules.maxConsecutiveFouls }).map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${i < state.awayConsecutiveFouls ? 'bg-rose-500' : 'bg-slate-800'}`} />
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 mt-4">
                        <button onClick={() => registerFoul("AWAY")} className="bg-rose-900/60 hover:bg-rose-800 text-rose-300 font-black py-4 px-5 rounded-2xl text-sm transition-all active:scale-95 border border-rose-900">
                            FALTA
                        </button>
                        <button onClick={() => registerRackWin("AWAY")} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl text-xl transition-all active:scale-95 shadow-lg">
                            + RACK
                        </button>
                    </div>
                </div>
            </div>

            {/* RACK CLEAR ANIMATION */}
            <AnimatePresence>
                {lastRackWinner && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.3 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className={`text-center px-16 py-10 rounded-3xl shadow-2xl border-2 ${lastRackWinner === "HOME" ? 'bg-emerald-900/90 border-emerald-500' : 'bg-indigo-900/90 border-indigo-500'}`}>
                            <div className="text-8xl mb-4">🎱</div>
                            <div className="text-5xl font-black text-white uppercase tracking-widest">¡RACK!</div>
                            <div className="text-xl text-slate-300 mt-2">{lastRackWinner === "HOME" ? "Carlos S." : "Daniel M."}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Network Badge — Sólo visible para el Director (corner izquierdo) */}
            <NetworkStatusBadge />
        </div>
    );
}
