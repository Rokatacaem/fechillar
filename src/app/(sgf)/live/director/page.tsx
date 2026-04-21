import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Director Dashboard - Live',
};

// Mapeo mock de torneo en vivo, esto derivaría de Prisma.
const ACTIVE_MATCHES = [
    { id: '1', table: 'Mesa 1', p1: 'C. Sanchez', p2: 'D. Mota', hcp1: 30, hcp2: 25, avg1: 1.25, avg2: 0.95, isPaused: false, innings: 12 },
    { id: '2', table: 'Mesa 2', p1: 'R. Reyes', p2: 'J. Perez', hcp1: 22, hcp2: 24, avg1: 0.88, avg2: 1.05, isPaused: true, innings: 19 },
    { id: '3', table: 'Mesa 3', p1: 'L. Gomez', p2: 'M. Silva', hcp1: 28, hcp2: 28, avg1: 1.45, avg2: 1.30, isPaused: false, innings: 28 },
    { id: '4', table: 'Mesa 4', p1: 'T. Vargas', p2: 'E. Ruiz', hcp1: 26, hcp2: 27, avg1: 1.01, avg2: 0.99, isPaused: false, innings: 33 },
];

export default function DirectorDashboard() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 pt-12">
            <div className="flex justify-between items-end mb-10 border-b border-slate-800 pb-6 w-full max-w-[1600px] mx-auto">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-sm">War Room</h1>
                    <p className="text-slate-400 mt-2 text-lg">Visión sinóptica del torneo en vivo</p>
                </div>
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div> 
                        <span className="font-semibold text-slate-300 tracking-wide">En Juego</span>
                    </span>
                    <span className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div> 
                        <span className="font-semibold text-slate-300 tracking-wide">Pausa Técnica</span>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1600px] mx-auto">
                {ACTIVE_MATCHES.map((m) => (
                    <div key={m.id} className={`rounded-2xl border ${m.isPaused ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800 bg-slate-900/60 backdrop-blur'} p-6 flex flex-col shadow-2xl transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]`}>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-2xl font-bold font-mono text-emerald-400 tracking-wider drop-shadow-sm">{m.table}</span>
                            <span className="text-sm bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-bold uppercase tracking-wider shadow-inner">
                                Inn {m.innings}
                            </span>
                        </div>

                        <div className="space-y-6">
                            {/* Jugador 1 */}
                            <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                                <div>
                                    <div className="font-bold text-xl text-white truncate max-w-[140px] drop-shadow-sm">{m.p1}</div>
                                    <div className="text-sm text-slate-500 font-medium mt-1">Meta: <span className="text-slate-300">{m.hcp1}</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-mono text-emerald-400 font-bold">{m.avg1.toFixed(3)}</div>
                                    <div className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">PGP</div>
                                </div>
                            </div>

                            {/* Separador Visual (VS) */}
                            <div className="relative flex items-center justify-center -my-3 z-10">
                                <span className="bg-slate-800 text-slate-500 text-xs font-black uppercase px-2 py-0.5 rounded shadow">VS</span>
                            </div>

                            {/* Jugador 2 */}
                            <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                                <div>
                                    <div className="font-bold text-xl text-white truncate max-w-[140px] drop-shadow-sm">{m.p2}</div>
                                    <div className="text-sm text-slate-500 font-medium mt-1">Meta: <span className="text-slate-300">{m.hcp2}</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-mono text-emerald-400 font-bold">{m.avg2.toFixed(3)}</div>
                                    <div className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">PGP</div>
                                </div>
                            </div>
                        </div>

                        {/* Indicador de Pausa Condicional */}
                        <div className={`mt-6 w-full ${m.isPaused ? 'bg-amber-500 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-transparent text-transparent opacity-0'} font-bold text-center py-2.5 rounded-xl text-sm uppercase tracking-widest transition-all duration-300`}>
                            ⚠ Pausa Técnica
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
