"use client";

import { useEffect, useState } from "react";

const POLLING_INTERVAL = 1000;

export default function MesaTVMonitor({ params }: { params: any }) {
    // 1080p Layout: "flex-row para los dos jugadores, nombres en text-7xl y el reloj en el centro masivo"
    const [state, setState] = useState({
        homeName: "Carlos Sánchez", homeScore: 21, homeTarget: 30, homeInnings: 20,
        awayName: "David Mota", awayScore: 28, awayTarget: 30, awayInnings: 20,
        clock: 40, isCritical: false,
    });

    useEffect(() => {
        // En producción: await fetch(`/api/match/${params.id}/state`);
        const int = setInterval(() => {
            // Se sincroniza con Redis/API para bajar el estado
        }, POLLING_INTERVAL);
        return () => clearInterval(int);
    }, []);

    return (
        <main className="w-screen h-screen overflow-hidden bg-slate-950 flex flex-row border-t-8 border-emerald-600 selection:bg-transparent cursor-none">
            {/* Jugador Home */}
            <div className="flex-1 flex flex-col justify-center items-center px-12 border-r border-slate-900 bg-gradient-to-br from-slate-900/50 to-slate-950">
                <h1 className="text-7xl font-black text-white mb-4 text-center tracking-tight truncate max-w-[90%] drop-shadow-lg">{state.homeName}</h1>
                <div className="text-3xl text-slate-400 font-bold uppercase tracking-[0.2em] mb-12">Meta: {state.homeTarget}</div>
                <div className="text-[20rem] font-sans font-black text-emerald-400 leading-none drop-shadow-[0_10px_20px_rgba(16,185,129,0.3)]">{state.homeScore}</div>
                <div className="mt-16 text-5xl text-slate-500 font-medium tracking-wide">Entradas: <span className="text-white font-bold">{state.homeInnings}</span></div>
            </div>

            {/* Reloj Central Masivo */}
            <div className="w-[480px] flex flex-col justify-center items-center bg-slate-950 z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
                <div className="absolute top-1/4 transform -translate-y-1/2 text-4xl text-slate-500 font-black tracking-[0.4em] uppercase text-center w-full">Shot Clock</div>
                <div className={`w-96 h-96 rounded-full flex items-center justify-center border-[16px] 
                    ${state.isCritical ? 'border-red-600 bg-red-950/20 animate-pulse text-red-500 shadow-[0_0_80px_rgba(220,38,38,0.6)]' : 'border-slate-800 bg-slate-900 text-white shadow-2xl'}
                    transition-colors duration-500`}>
                    <span className="text-[12rem] font-black font-mono tracking-tighter leading-none mt-4">
                        {state.clock}
                    </span>
                </div>
                
                {/* Branding space */}
                <div className="absolute bottom-[15%] w-full flex justify-center">
                    <div className="px-6 py-2 bg-slate-900 rounded-full border border-slate-800">
                         <span className="text-xl font-bold tracking-[0.3em] uppercase text-slate-400">FECHILLAR TV</span>
                    </div>
                </div>
            </div>

            {/* Jugador Away */}
            <div className="flex-1 flex flex-col justify-center items-center px-12 border-l border-slate-900 bg-gradient-to-bl from-slate-900/50 to-slate-950">
                <h1 className="text-7xl font-black text-white mb-4 text-center tracking-tight truncate max-w-[90%] drop-shadow-lg">{state.awayName}</h1>
                <div className="text-3xl text-slate-400 font-bold uppercase tracking-[0.2em] mb-12">Meta: {state.awayTarget}</div>
                <div className="text-[20rem] font-sans font-black text-slate-300 leading-none drop-shadow-2xl">{state.awayScore}</div>
                <div className="mt-16 text-5xl text-slate-500 font-medium tracking-wide">Entradas: <span className="text-white font-bold">{state.awayInnings}</span></div>
            </div>
        </main>
    )
}
