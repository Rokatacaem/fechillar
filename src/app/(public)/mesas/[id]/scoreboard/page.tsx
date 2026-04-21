"use client";

import { use, useEffect, useState } from "react";
import { useMatchRealtimeProvider } from "@/lib/realtime/useMatchSync";

export default function HighContrastScoreboardTV({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [state, setState] = useState({
        p1Name: "JUGADOR 1", p1Score: 0, p1Target: 30, p1Innings: 0,
        p2Name: "JUGADOR 2", p2Score: 0, p2Target: 30, p2Innings: 0,
        clock: 40, isCritical: false, isZero: false
    });

    // Subscripción Pusher Bridge a la API Realtime
    useMatchRealtimeProvider(id, (payload) => {
        // En un caso real procesamos Action payloads y actualizamos state
        // Ej: setState(prev => ({...prev, p1Score: prev.p1Score + 1}))
    });

    // Faking clock drop down para la visual de muestra sin conexion al movil
    useEffect(() => {
        const int = setInterval(() => {
            setState(s => {
                if (s.clock <= 0) return { ...s, clock: 0, isCritical: false, isZero: true };
                const nClock = s.clock - 1;
                return { ...s, clock: nClock, isCritical: nClock <= 10 };
            });
        }, 1000);
        return () => clearInterval(int);
    }, []);

    // ALERTA ROJA MASIVA: Total Screen Red Pulse
    const clockBg = state.isZero ? 'bg-red-900 border-red-500' : state.isCritical ? 'bg-red-950 animate-pulse border-red-600' : 'bg-black border-yellow-800';
    const numColor = (state.isZero || state.isCritical) ? 'text-white' : 'text-yellow-400';

    return (
        <main className={`h-screen w-screen overflow-hidden ${state.isCritical ? 'bg-red-950 animate-pulse' : 'bg-black'} cursor-none flex px-12 py-8 transition-colors duration-[1000ms]`}>
            {/* Contendor Global de Marcador Vertical */}
            <div className="h-full w-full flex flex-col justify-between items-center text-white font-sans font-black tracking-wider uppercase">

                <div className="w-full h-1/3 flex border-b border-gray-900 py-4 justify-between items-center gap-12">
                   {/* P1 Section */}
                   <div className="w-2/5 flex flex-col items-center">
                       <h2 className="text-[12rem] leading-none drop-shadow-md truncate text-gray-200">{state.p1Name}</h2>
                       <div className="text-[4rem] text-gray-500 mt-2">META {state.p1Target}</div>
                   </div>

                   {/* P2 Section */}
                   <div className="w-2/5 flex flex-col items-center">
                       <h2 className="text-[12rem] leading-none drop-shadow-md truncate text-gray-200">{state.p2Name}</h2>
                       <div className="text-[4rem] text-gray-500 mt-2">META {state.p2Target}</div>
                   </div>
                </div>

                <div className="w-full flex-1 flex justify-between items-center px-16 relative">
                    <span className="text-[25rem] leading-none font-mono text-white mix-blend-screen drop-shadow-lg">{state.p1Score}</span>
                    
                    {/* SHOT CLOCK */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
                        <div className={`rounded-full h-[500px] w-[500px] border-[24px] flex justify-center items-center ${clockBg} shadow-[0_0_100px_rgba(0,0,0,1)]`}>
                            <span className={`text-[15rem] leading-none font-mono ${numColor} mix-blend-screen drop-shadow-lg`}>{state.clock}</span>
                        </div>
                    </div>

                    <span className="text-[25rem] leading-none font-mono text-white mix-blend-screen drop-shadow-lg">{state.p2Score}</span>
                </div>

                <div className="w-full text-center text-[7rem] text-gray-600 border-t border-gray-900 pt-8 pb-4">
                     ENTRADAS: <span className="text-white ml-8">{state.p1Innings}</span>
                </div>

            </div>
        </main>
    );
}
