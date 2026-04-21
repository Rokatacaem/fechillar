"use client";

import React from "react";
import { Star, TrendingUp, Zap, Award } from "lucide-react";

interface Performer {
    playerName: string;
    clubName: string;
    average: number;
    highRun: number;
}

export function LiveTopPerformers({ performers }: { performers: { byAverage: any[], byHighRun: any[] } }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-8 max-w-6xl mx-auto">
            {/* Top Averages (PGP) */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                        <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Top Promedios</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Rendimiento General (PGP)</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {performers.byAverage.map((p, idx) => (
                        <div key={idx} className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl flex items-center justify-between transition-all hover:bg-slate-900">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase">{p.playerName}</p>
                                    <p className="text-[9px] text-slate-600 font-black uppercase">{p.clubName}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-amber-500 font-mono tracking-tighter">{p.average.toFixed(3)}</p>
                                <p className="text-[8px] text-slate-700 uppercase font-black">PGP</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top High Runs */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Series Mayores</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Carambolas seguidas (HR)</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {performers.byHighRun.map((p, idx) => (
                        <div key={idx} className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl flex items-center justify-between transition-all hover:bg-slate-900">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    <Zap className="w-3 h-3" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase">{p.playerName}</p>
                                    <p className="text-[9px] text-slate-600 font-black uppercase">{p.clubName}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-blue-500 font-mono tracking-tighter">+{p.highRun}</p>
                                <p className="text-[8px] text-slate-700 uppercase font-black">Carambolas</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
