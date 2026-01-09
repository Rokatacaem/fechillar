export default function PlayerRankings() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Mi Rendimiento</h1>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 px-2 border-l-4 border-[var(--color-primary)]">Tres Bandas</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">Ranking Nacional</div>
                            <div className="text-2xl font-bold text-[var(--color-primary)]">#12</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">Promedio General</div>
                            <div className="text-2xl font-bold text-slate-700">0.850</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">Mejor Serie</div>
                            <div className="text-2xl font-bold text-slate-700">9</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">Partidas Jugadas</div>
                            <div className="text-2xl font-bold text-slate-700">156</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 opacity-60">
                    <h3 className="font-bold text-slate-700 mb-4 px-2 border-l-4 border-slate-400">Pool Bola 9</h3>
                    <div className="flex items-center justify-center h-40 text-slate-400">
                        No registra actividad reciente
                    </div>
                </div>
            </div>

            {/* Detailed Points History Table */}
            <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Historial de Puntos</h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="p-4 font-medium">Fecha</th>
                                <th className="p-4 font-medium">Torneo / Evento</th>
                                <th className="p-4 font-medium">Posición</th>
                                <th className="p-4 font-medium text-right bg-slate-100">Puntos Obtenidos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="p-4 text-slate-500">12 Ago 2025</td>
                                <td className="p-4 font-medium text-slate-700">Selectivo Nacional #3</td>
                                <td className="p-4 text-slate-500">4° Lugar</td>
                                <td className="p-4 text-right font-bold text-[var(--color-primary)] bg-slate-50">+80</td>
                            </tr>
                            <tr>
                                <td className="p-4 text-slate-500">05 Jun 2025</td>
                                <td className="p-4 font-medium text-slate-700">Nacional Apertura</td>
                                <td className="p-4 text-slate-500">8vos de Final</td>
                                <td className="p-4 text-right font-bold text-[var(--color-primary)] bg-slate-50">+40</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
