export default function PlayerDashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Hola, Alejandro</h1>
                    <p className="text-slate-500">Bienvenido a tu panel de gestión deportiva.</p>
                </div>
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold border border-green-200">
                    ● Licencia Activa 2026
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-slate-400 text-sm font-medium uppercase mb-2">Ranking Nacional</div>
                    <div className="text-4xl font-bold text-[var(--color-primary)]">#12</div>
                    <div className="text-sm text-green-600 mt-2">↑ Subiste 2 puestos</div>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-slate-400 text-sm font-medium uppercase mb-2">Promedio General</div>
                    <div className="text-4xl font-bold text-[var(--color-primary)]">0.850</div>
                    <div className="text-sm text-slate-500 mt-2">Tres Bandas</div>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-slate-400 text-sm font-medium uppercase mb-2">Torneos Jugados</div>
                    <div className="text-4xl font-bold text-[var(--color-primary)]">8</div>
                    <div className="text-sm text-slate-500 mt-2">Temporada 2025</div>
                </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Matches */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-6">Últimos Resultados</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-700">vs. Marco Sobarzo</span>
                                    <span className="text-xs text-slate-400">Torneo Nacional - Fecha {i}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold ${i === 1 ? 'text-green-600' : 'text-red-500'}`}>
                                        {i === 1 ? 'Ganado' : 'Perdido'}
                                    </span>
                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-mono">
                                        30 - {i === 1 ? '22' : '40'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Digital Card Preview */}
                <div className="bg-[var(--color-primary)] text-white rounded-2xl shadow-xl p-6 relative overflow-hidden flex flex-col items-center text-center">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>

                    <h3 className="relative z-10 font-bold text-lg mb-1">Carnet Digital</h3>
                    <p className="relative z-10 text-xs text-blue-200 mb-6">Federación Chilena de Billar</p>

                    {/* Fake QR */}
                    <div className="bg-white p-2 rounded-lg mb-4">
                        <div className="w-32 h-32 bg-slate-900 pattern-dots"></div>
                    </div>

                    <p className="font-mono text-sm tracking-widest opacity-80">SOCIO #9482</p>

                    <button className="mt-6 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-sm transition-colors">
                        Ver Detalle Completo
                    </button>
                </div>
            </div>
        </div>
    );
}
