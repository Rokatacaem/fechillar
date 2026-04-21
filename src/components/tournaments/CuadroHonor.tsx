"use client";

import { Trophy, Medal, Award, FileDown } from 'lucide-react';

interface CuadroHonorProps {
    participants: {
        id: string;
        name: string;
        rank: number;
        handicap?: number;
    }[];
    tournamentId: string;
}

export function CuadroHonor({ participants, tournamentId }: CuadroHonorProps) {
    const sortedParticipants = [...participants].sort((a, b) => a.rank - b.rank).filter(p => p.rank > 0);

    const handleDownload = () => {
        window.open(`/api/tournaments/${tournamentId}/standings-pdf`, '_blank');
    };

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/10 p-3 rounded-2xl">
                        <Trophy className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Cuadro de Honor</h2>
                        <p className="text-slate-500 text-sm">Ubicaciones finales de la competencia</p>
                    </div>
                </div>

                <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                    <FileDown className="w-5 h-5" />
                    <span>REPORTE OFICIAL (PDF)</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedParticipants.map((p, index) => {
                    const isPodium = p.rank <= 3;
                    return (
                        <div 
                            key={p.id} 
                            className={`flex items-center gap-4 p-4 rounded-2xl ${
                                isPodium ? 'bg-white/5 border border-white/10' : 'bg-transparent border border-white/5'
                            } transition-all hover:scale-[1.02]`}
                        >
                            <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg ${
                                p.rank === 1 ? 'bg-yellow-500 text-slate-950' : 
                                p.rank === 2 ? 'bg-slate-300 text-slate-950' : 
                                p.rank === 3 ? 'bg-amber-700 text-white' : 
                                'bg-slate-800 text-slate-400'
                            }`}>
                                {p.rank}°
                            </div>
                            <div className="flex-1">
                                <div className="text-white font-bold text-sm truncate">{p.name}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    {p.handicap && <span>Hdcp: {p.handicap}</span>}
                                    {isPodium && (
                                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                                            <Medal className="w-2 h-2" /> PODIUM
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sortedParticipants.length === 0 && (
                <div className="text-center py-12">
                    <Award className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No se han registrado ubicaciones finales aún.</p>
                </div>
            )}
        </div>
    );
}
