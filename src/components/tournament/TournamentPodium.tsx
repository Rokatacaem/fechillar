import React from "react";
import Image from "next/image";
import { Medal, Trophy } from "lucide-react";

interface PlayerData {
    user: { name: string };
    club: { name: string; primaryColor?: string };
    photoUrl: string | null;
}

interface PodiumProps {
    champion: PlayerData;
    runnerUp: PlayerData;
    bronze: PlayerData[]; // Array de bronces (1 o 2)
}

export function TournamentPodium({ champion, runnerUp, bronze }: PodiumProps) {
    // Si hay dos semifinalistas, agarramos el primero visualmente para el podio, 
    // o mostramos un label compuesto si queremos (aquí mostraremos el primero para simplificar estética)
    const thirdPlace = bronze[0];

    return (
        <div className="relative w-full max-w-5xl mx-auto py-12 px-4 select-none">
            {/* Header del Podio */}
            <div className="text-center mb-16 space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full mb-4">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-widest uppercase">Hall of Fame Nacional</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                    Podio de Ganadores
                </h2>
            </div>

            {/* Plataformas */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 mt-24 h-[400px]">
                
                {/* 2DO LUGAR - PLATA (IZQUIERDA) */}
                <div className="w-full md:w-64 flex flex-col items-center justify-end h-[85%] relative group">
                    {/* Avatar flotante */}
                    <div className="absolute -top-20 z-20 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full border-4 border-[#e2e8f0] bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl shadow-white/10 relative">
                            {runnerUp?.photoUrl ? (
                                <Image src={runnerUp.photoUrl} alt="Plata" width={96} height={96} className="object-cover w-full h-full" />
                            ) : (
                                <span className="text-2xl font-black text-slate-400">
                                    {runnerUp?.user?.name?.substring(0,2).toUpperCase()}
                                </span>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-[#e2e8f0] w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                <span className="text-slate-900 font-bold text-sm">2</span>
                            </div>
                        </div>
                    </div>
                    {/* Pilar Plata */}
                    <div className="w-full h-full bg-gradient-to-t from-slate-900 to-slate-800/80 border-t-4 border-[#e2e8f0] rounded-t-2xl shadow-[0_0_50px_rgba(226,232,240,0.05)] relative overflow-hidden backdrop-blur-md">
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/5 to-transparent" />
                        <div className="p-6 pt-12 flex flex-col items-center text-center">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight line-clamp-2 leading-none mb-2">
                                {runnerUp?.user?.name}
                            </h3>
                            <p className="text-[10px] text-[#e2e8f0]/60 font-bold tracking-widest uppercase">
                                {runnerUp?.club?.name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 1ER LUGAR - ORO (CENTRO) */}
                <div className="w-full md:w-72 flex flex-col items-center justify-end h-full z-30 relative group">
                    {/* Aura dorada */}
                    <div className="absolute -top-32 w-64 h-64 bg-yellow-500/20 blur-[100px] rounded-full z-0" />
                    
                    {/* Avatar flotante gigante */}
                    <div className="absolute -top-24 z-20 flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full border-4 border-[#fbbf24] bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl shadow-yellow-500/20 relative">
                            {champion?.photoUrl ? (
                                <Image src={champion.photoUrl} alt="Oro" width={128} height={128} className="object-cover w-full h-full" />
                            ) : (
                                <span className="text-4xl font-black text-slate-400">
                                    {champion?.user?.name?.substring(0,2).toUpperCase()}
                                </span>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-[#fbbf24] w-10 h-10 rounded-full border-4 border-slate-900 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-slate-900" />
                            </div>
                        </div>
                    </div>
                    {/* Pilar Oro */}
                    <div className="w-full h-full bg-gradient-to-t from-slate-900 to-yellow-900/40 border-t-4 border-[#fbbf24] rounded-t-2xl shadow-[0_0_80px_rgba(251,191,36,0.15)] relative overflow-hidden backdrop-blur-md">
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-yellow-500/20 to-transparent" />
                        <div className="p-6 pt-16 flex flex-col items-center text-center">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight line-clamp-2 leading-none mb-2 text-shadow-sm">
                                {champion?.user?.name}
                            </h3>
                            <p className="text-xs text-yellow-500 font-bold tracking-widest uppercase">
                                {champion?.club?.name}
                            </p>
                            <span className="mt-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded text-xs font-black">
                                CAMPEÓN
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3ER LUGAR - BRONCE (DERECHA) */}
                <div className="w-full md:w-64 flex flex-col items-center justify-end h-[70%] relative group">
                    {/* Avatar flotante */}
                    <div className="absolute -top-16 z-20 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full border-4 border-[#b45309] bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl relative">
                            {thirdPlace?.photoUrl ? (
                                <Image src={thirdPlace.photoUrl} alt="Bronce" width={80} height={80} className="object-cover w-full h-full" />
                            ) : (
                                <span className="text-xl font-black text-slate-400">
                                    {thirdPlace?.user?.name?.substring(0,2).toUpperCase() || "TBD"}
                                </span>
                            )}
                            <div className="absolute -bottom-2 -left-2 bg-[#b45309] w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">3</span>
                            </div>
                        </div>
                    </div>
                    {/* Pilar Bronce */}
                    <div className="w-full h-full bg-gradient-to-t from-slate-900 to-amber-950/40 border-t-4 border-[#b45309] rounded-t-2xl relative overflow-hidden backdrop-blur-md">
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-500/10 to-transparent" />
                        <div className="p-6 pt-10 flex flex-col items-center text-center">
                            <h3 className="text-md font-black text-white uppercase tracking-tight line-clamp-2 leading-none mb-2">
                                {thirdPlace?.user?.name || "TBD"}
                            </h3>
                            <p className="text-[10px] text-amber-600 font-bold tracking-widest uppercase">
                                {thirdPlace?.club?.name || "..."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Institucional / Transmisión estetica */}
            <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 mx-auto w-full max-w-4xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                <span className="text-xs font-black text-slate-500 tracking-widest uppercase">
                    Presentado por <span className="text-white">Autolink</span>
                </span>
                <span className="text-xs font-bold text-slate-600 font-mono">
                    FECHILLAR SGF CORE // FINAL RESULTS
                </span>
            </div>
        </div>
    );
}
