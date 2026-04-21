"use client";

import { useState } from "react";
import { overrideMatchScore } from "./actions";

// Mock Data
const ACTIVE_TABLES = [
    { id: "match-1234", table: "Mesa 1 (TV Main)", p1: "C. Sánchez", p2: "D. Mota" },
    { id: "match-5678", table: "Mesa 2 (Tribuna)", p1: "R. Reyes", p2: "J. Pérez" }
];

export default function StreamingControlRoom() {
    const [overrideEnabled, setOverrideEnabled] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(ACTIVE_TABLES[0].id);
    const [isTestingChroma, setIsTestingChroma] = useState(false);
    
    // In a real environment, this triggers a mock event to the overlay using the same BroadcastChannel or Pusher.
    const handleChromaTest = () => {
        setIsTestingChroma(!isTestingChroma);
        const channel = new BroadcastChannel(`match-channel-${selectedMatch}`);
        channel.postMessage({ type: 'chroma-test', payload: !isTestingChroma });
        channel.close();
    };

    const handleOverride = async (type: string, playerTarget: "HOME" | "AWAY", value: number) => {
        if (!overrideEnabled) return;
        try {
            await overrideMatchScore(selectedMatch, { type, playerTarget, value });
            // Broadcast al TV
            const channel = new BroadcastChannel(`match-channel-${selectedMatch}`);
            channel.postMessage({ type: 'score-override', payload: { playerTarget, value } });
            channel.close();
        } catch(e) {
            alert("Error ejecutando Override");
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 p-8 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto space-y-8">

                <header className="border-b border-slate-800 pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></span>
                            Switcher & Producción
                        </h1>
                        <p className="text-slate-400 font-medium text-lg">Módulo de Control de Cámaras (Live Broadcasting)</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Lista de Mesas Activas para OBS */}
                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                           <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                               <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                               Mesas Televisadas
                           </h2>
                           <button 
                                onClick={handleChromaTest}
                                className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${isTestingChroma ? 'bg-green-500 border-green-400 text-slate-900 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                           >
                               {isTestingChroma ? '🔴 Chroma Test ON' : 'Chroma Key Test'}
                           </button>
                        </div>

                        <ul className="space-y-4">
                            {ACTIVE_TABLES.map(table => {
                                const url = `https://fechillar.cl/overlay/${table.id}`;
                                return (
                                    <li key={table.id} className="bg-[#0b1120] border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-slate-700 transition">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white text-lg">{table.table}</span>
                                            <span className="text-slate-400 text-sm tracking-wide">{table.p1} vs {table.p2}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" readOnly value={url} className="bg-slate-900 border border-slate-800 text-slate-500 text-xs px-3 rounded outline-none w-48 font-mono select-all" />
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(url)}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2 text-xs rounded transition flex items-center gap-1"
                                            >
                                                Copiar Link OBS
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* OVERRIDE MASTER PANEL */}
                    <div className="bg-slate-900 border-2 border-red-900/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(153,27,27,0.1)] relative overflow-hidden">
                        
                        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                            <h2 className="text-md font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                Master Override
                            </h2>
                            
                            {/* SAFETY SWITCH */}
                            <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={overrideEnabled} onChange={() => setOverrideEnabled(!overrideEnabled)} />
                                    <div className={`block w-14 h-8 rounded-full transition-colors ${overrideEnabled ? 'bg-rose-600' : 'bg-slate-700'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${overrideEnabled ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                        </div>

                        {!overrideEnabled ? (
                            <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                                <div className="text-center">
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Controles Bloqueados</p>
                                    <p className="text-slate-600 text-xs mt-1">Activar switch para forzar BDD</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-2 block">Mesa en Operación</label>
                                    <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)} className="w-full bg-[#0b1120] text-slate-200 border border-rose-900/50 rounded p-2 focus:outline-none">
                                        {ACTIVE_TABLES.map(t => <option key={t.id} value={t.id}>{t.table}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Local Override */}
                                    <div className="bg-[#0b1120] p-3 rounded-lg border border-slate-800 text-center">
                                        <div className="text-xs font-bold text-slate-400 mb-2">SCORE L.</div>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleOverride('SCORE', 'HOME', -1)} className="bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded font-black text-rose-400">-1</button>
                                            <button onClick={() => handleOverride('SCORE', 'HOME', 1)} className="bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded font-black text-emerald-400">+1</button>
                                        </div>
                                    </div>

                                    {/* Away Override */}
                                    <div className="bg-[#0b1120] p-3 rounded-lg border border-slate-800 text-center">
                                        <div className="text-xs font-bold text-slate-400 mb-2">SCORE V.</div>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleOverride('SCORE', 'AWAY', -1)} className="bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded font-black text-rose-400">-1</button>
                                            <button onClick={() => handleOverride('SCORE', 'AWAY', 1)} className="bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded font-black text-emerald-400">+1</button>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => handleOverride('CLOCK', 'HOME', 0)} className="w-full bg-amber-600 hover:bg-amber-500 text-slate-900 font-black py-3 rounded-lg uppercase tracking-widest transition shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                                    Reset Reloj Tiros
                                </button>
                                
                                <p className="text-rose-500 text-[10px] text-center mt-2 leading-tight">
                                    ADVERTENCIA: Cualquier mutación ejecutada aquí destrozará la continuidad del árbitro en mesa y será grabada en el Server AuditLog bajo etiqueta [STREAM_OVERRIDE].
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
