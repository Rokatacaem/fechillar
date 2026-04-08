export default function OfficialDashboard() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800">Panel de Control</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-2">Clubes Activos</div>
                    <div className="text-3xl font-bold text-slate-800">24</div>
                    <div className="text-xs text-green-600 mt-2">● 2 pendientes de validación</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-2">Jugadores Federados</div>
                    <div className="text-3xl font-bold text-slate-800">842</div>
                    <div className="text-xs text-slate-400 mt-2">+5% vs mes anterior</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-2">Recaudación Mes</div>
                    <div className="text-3xl font-bold text-slate-800">$1.2M</div>
                    <div className="text-xs text-slate-400 mt-2">Cuotas + Inscripciones</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-2">Próximo Torneo</div>
                    <div className="text-lg font-bold text-[var(--color-secondary)] leading-tight">Nacional 3 Bandas</div>
                    <div className="text-xs text-slate-400 mt-2">15 Días restantes</div>
                </div>
            </div>

            {/* Recent Actions & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Solicitudes Pendientes</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            <div>
                                <div className="font-semibold text-slate-800">Club Copiapó</div>
                                <div className="text-xs text-slate-500">Solicitud de Afiliación</div>
                            </div>
                            <button className="px-3 py-1 bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600 rounded">Revisar</button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div>
                                <div className="font-semibold text-slate-800">Pago Masivo - Club Santiago</div>
                                <div className="text-xs text-slate-500">Inscripción 12 jugadores</div>
                            </div>
                            <button className="px-3 py-1 bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600 rounded">Validar</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Accesos Rápidos</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left group">
                            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">📄</div>
                            <div className="font-semibold text-slate-700">Nueva Acta</div>
                        </button>
                        <button className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left group">
                            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">🏆</div>
                            <div className="font-semibold text-slate-700">Crear Torneo</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
