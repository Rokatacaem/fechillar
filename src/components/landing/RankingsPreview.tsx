
const TOP_PLAYERS = [
    { rank: 1, name: "Alejandro Carvajal", club: "Club Billar Santiago", points: 1540 },
    { rank: 2, name: "Marco Sobarzo", club: "Club Temuco", points: 1420 },
    { rank: 3, name: "Luis Aveiga", club: "Club Concepción", points: 1350 },
    { rank: 4, name: "Juan Pablo Sisternas", club: "Club Viña del Mar", points: 1280 },
    { rank: 5, name: "Enrique Rojas", club: "Club Valdivia", points: 1150 },
];

export default function RankingsPreview() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="text-left">
                        <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-primary)]">
                            Ranking Nacional
                        </h2>
                        <p className="mt-4 text-slate-600">
                            Top 5 - Tres Bandas (Masculino)
                        </p>
                    </div>
                    <button className="text-[var(--color-secondary)] font-semibold hover:text-red-800 transition-colors flex items-center gap-2">
                        Ver Ranking Completo <span>→</span>
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Jugador</th>
                                    <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Club</th>
                                    <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider text-right">Puntos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {TOP_PLAYERS.map((player) => (
                                    <tr key={player.rank} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`
                            flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                            ${player.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                    player.rank === 2 ? 'bg-slate-200 text-slate-700' :
                                                        player.rank === 3 ? 'bg-orange-100 text-orange-800' : 'text-slate-500'}
                        `}>
                                                {player.rank}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--color-primary)]">
                                            {player.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                            {player.club}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-700">
                                            {player.points}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
