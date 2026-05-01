"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMatchRealtimeProvider } from "@/lib/realtime/useMatchSync";

// MOCK SPONSORS
const SPONSORS = [
    "https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_TVP.svg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b5/Predator_logo.svg",
    "https://upload.wikimedia.org/wikipedia/commons/2/20/Logo_de_la_F%C3%A9d%C3%A9ration_Fran%C3%A7aise_de_Billard.png"
];

export default function LowerThirdOverlay({ params }: { params: any }) {
    const matchId = params.id;
    const [state, setState] = useState({
        p1Name: "CARLOS SÁNCHEZ", p1Score: 18, p1Target: 30,
        p2Name: "DANIEL MOTA", p2Score: 24, p2Target: 28,
        clock: 40, isCritical: false, isZero: false,
        innings: 12, currentRun: 3
    });

    const [currentSponsor, setCurrentSponsor] = useState(0);

    // Sponsor Rotation Engine (Every 60 secs)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSponsor(prev => (prev + 1) % SPONSORS.length);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Sincronización de Baja Latencia
    useMatchRealtimeProvider(matchId, (payload) => {
        // Mock process payload updating
        // e.g., if (payload.action === 'score_add') setScore(p => p+1)
    });

    // Mock Clock for isolated testing
    useEffect(() => {
        const int = setInterval(() => {
            setState(s => {
                const nClock = s.clock > 0 ? s.clock - 1 : 0;
                return { ...s, clock: nClock, isCritical: nClock <= 10, isZero: nClock === 0 };
            });
        }, 1000);
        return () => clearInterval(int);
    }, []);

    // Animations Config ESPN Style
    const flipVariants = {
        hidden: { opacity: 0, y: -20, rotateX: 90 },
        visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.3, type: "spring" } },
        exit: { opacity: 0, y: 20, rotateX: -90, transition: { duration: 0.2 } }
    };

    return (
        <main className="w-screen h-screen bg-transparent overflow-hidden relative font-sans">

            {/* LOWER THIRD ANCHOR */}
            <div className="absolute bottom-16 left-0 right-0 px-16 flex justify-center">
                <div className="flex bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden h-28 transform transition-all items-center">

                    {/* SPONSOR ROTATOR */}
                    <div className="w-48 h-full bg-white flex items-center justify-center p-4 border-r-4 border-emerald-500">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={currentSponsor}
                                src={SPONSORS[currentSponsor]}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="max-w-full max-h-full object-contain grayscale opacity-80"
                            />
                        </AnimatePresence>
                    </div>

                    {/* JUGADOR 1 */}
                    <div className="flex px-8 py-2 w-96 items-center justify-between border-r border-slate-700/50 relative">
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-white tracking-wide uppercase drop-shadow-md">{state.p1Name}</span>
                            <span className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-xs">Meta: {state.p1Target}</span>
                            {/* SET POINT BADGE */}
                            {state.p1Target - state.p1Score <= 2 && (
                                <span className="absolute -top-3 left-8 bg-rose-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded shadow-lg animate-pulse">SET POINT</span>
                            )}
                        </div>
                        <div className="text-[4.5rem] font-black text-white font-mono leading-none drop-shadow-2xl">
                            <AnimatePresence mode="popLayout">
                                {/* FIX APLICADO AQUÍ */}
                                <motion.span key={state.p1Score} variants={flipVariants as any} initial="hidden" animate="visible" exit="exit" className="inline-block">
                                    {state.p1Score}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* MIDDLE STATS (Innings & Run) */}
                    <div className="flex flex-col px-6 justify-center items-center h-full border-r border-slate-700/50 bg-slate-900 shadow-inner min-w-32">
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Entradas</div>
                        <div className="text-3xl text-emerald-500 font-mono font-black">{state.innings}</div>

                        {state.currentRun > 0 && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2 bg-amber-500 text-slate-900 text-xs px-2 py-0.5 rounded font-bold uppercase">
                                Serie: {state.currentRun}
                            </motion.div>
                        )}
                    </div>

                    {/* JUGADOR 2 */}
                    <div className="flex px-8 py-2 w-96 items-center justify-between relative">
                        <div className="text-[4.5rem] font-black text-white font-mono leading-none drop-shadow-2xl">
                            <AnimatePresence mode="popLayout">
                                {/* FIX APLICADO AQUÍ TAMBIÉN */}
                                <motion.span key={state.p2Score} variants={flipVariants as any} initial="hidden" animate="visible" exit="exit" className="inline-block relative">
                                    {state.p2Score}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-3xl font-black text-white tracking-wide uppercase drop-shadow-md">{state.p2Name}</span>
                            <span className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-xs">Meta: {state.p2Target}</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* MINIMAL SHOT CLOCK BAR */}
            <div className={`absolute bottom-[66px] left-1/2 transform -translate-x-1/2 w-[800px] h-2 rounded-full overflow-hidden ${state.isCritical ? 'bg-red-950/80 shadow-[0_0_15px_red]' : 'bg-slate-900/50'}`}>
                <motion.div
                    className={`h-full ${state.isCritical ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                    animate={{ width: `${(state.clock / 40) * 100}%` }}
                    transition={{ ease: "linear", duration: 1 }}
                />
            </div>

        </main>
    );
}