import React from 'react';
import prisma from "@/lib/prisma";
import { calculatePowerRanking } from "@/lib/billiards/rankings";
import { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Target, Zap, ChevronRight, User } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Ranking de Poder Federativo | FECHILLAR',
    description: 'Ranking oficial de jugadores de billar federados basado en el algoritmo de poder 60/30/10 (Puntos, Promedio, Tacada).',
};

export default async function RankingsPage() {
    const rankings = await calculatePowerRanking("THREE_BAND");

    return (
        <div className="bg-[#020817] min-h-screen py-12 md:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-[0.2em] mb-6 animate-in fade-in slide-in-from-top duration-700">
                        Top Performers Chile
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase mb-4 animate-in fade-in slide-in-from-top duration-1000">
                        Ranking de <span className="text-emerald-500">Poder</span>
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base font-medium">
                        Algoritmo Federativo v3.1: <span className="text-slate-300">60% Puntos</span> + <span className="text-slate-300">30% Promedio</span> + <span className="text-slate-300">10% Mayor Tacada</span>.
                    </p>
                </header>

                <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-3xl shadow-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Pos</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Jugador</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Power Score</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">PGP</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">M. Tacada</th>
                                <th className="p-6 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rankings.map((player, index) => {
                                const isTop3 = index < 3;
                                return (
                                    <tr key={player.playerId} className="group hover:bg-white/[0.02] transition-all">
                                        <td className="p-6">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                                                index === 0 ? 'bg-yellow-500 text-black' :
                                                index === 1 ? 'bg-slate-300 text-black' :
                                                index === 2 ? 'bg-amber-700 text-white' :
                                                'bg-slate-800 text-slate-400'
                                            }`}>
                                                {index + 1}°
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-black tracking-tight group-hover:text-emerald-400 transition-colors uppercase">
                                                    {player.name}
                                                </span>
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                                                    {player.club}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-black text-lg">
                                                <Zap className="w-4 h-4" />
                                                {player.powerScore}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex items-center gap-2 text-slate-300 font-mono font-bold">
                                                <Target className="w-4 h-4 text-emerald-500" />
                                                {player.average.toFixed(3)}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex items-center gap-2 text-slate-300 font-mono font-bold">
                                                <Trophy className="w-4 h-4 text-amber-500" />
                                                {player.highRun}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right pr-8">
                                            <Link 
                                                href={`/jugadores/${player.name.toLowerCase().replace(/ /g, '-')}`}
                                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 text-slate-500 group-hover:bg-emerald-500 group-hover:text-black transition-all"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <footer className="mt-12 text-center">
                    <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                        Actualizado en tiempo real por el SGF de FECHILLAR
                    </p>
                </footer>
            </div>
        </div>
    );
}

