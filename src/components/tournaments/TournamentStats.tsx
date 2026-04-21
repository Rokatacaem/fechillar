"use client";

import { Zap, Target, Star, Trophy } from 'lucide-react';

interface TournamentStatsProps {
    bestRun: {
        value: number;
        playerName: string;
    };
    bestAverage: {
        value: number;
        playerName: string;
    };
}

export function TournamentStats({ bestRun, bestAverage }: TournamentStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mayor Tacada (High Run) */}
            <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <div className="bg-amber-500/10 p-4 rounded-2xl">
                            <Zap className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                        <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-amber-500/20 uppercase tracking-widest">
                            Tournament Record
                        </span>
                    </div>
                    
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Mayor Tacada</p>
                        <div className="flex items-baseline gap-4 mb-4">
                            <h2 className="text-6xl font-black text-white tracking-tighter">{bestRun.value}</h2>
                            <span className="text-slate-600 text-sm font-bold uppercase">Carambolas</span>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            </div>
                            <span className="text-white font-bold text-sm">{bestRun.playerName}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mejor Promedio (Best Average) */}
            <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <div className="bg-emerald-500/10 p-4 rounded-2xl">
                            <Target className="w-8 h-8 text-emerald-500 animate-bounce-subtle" />
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                            Eficiencia Top
                        </span>
                    </div>
                    
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Mejor Promedio (PGP)</p>
                        <div className="flex items-baseline gap-4 mb-4">
                            <h2 className="text-6xl font-black text-emerald-500 tracking-tighter">{bestAverage.value}</h2>
                            <span className="text-slate-600 text-sm font-bold uppercase">Prom. Gral.</span>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-white font-bold text-sm">{bestAverage.playerName}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
