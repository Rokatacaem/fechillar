export default function PlayerTournaments() {
    const tournaments = [
        {
            id: 1,
            name: "Nacional Tres Bandas Clausura",
            date: "15 Oct 2025",
            status: "Inscripciones Abiertas",
            fee: "$25.000",
            location: "Club Billar Santiago"
        },
        {
            id: 2,
            name: "Abierto Bola 9 - Zona Sur",
            date: "22 Nov 2025",
            status: "Próximamente",
            fee: "$15.000",
            location: "Club Temuco"
        }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Calendario de Torneos</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {tournaments.map((t) => (
                        <div key={t.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                            <div className="flex-1">
                                <div className={`text-xs font-bold uppercase mb-1 ${t.status === 'Inscripciones Abiertas' ? 'text-green-600' : 'text-slate-500'}`}>
                                    {t.status}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">{t.name}</h3>
                                <div className="text-sm text-slate-500 mt-1 flex gap-4">
                                    <span>📅 {t.date}</span>
                                    <span>📍 {t.location}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-sm text-slate-400">Inscripción</div>
                                    <div className="font-bold text-slate-700">{t.fee}</div>
                                </div>
                                <button
                                    disabled={t.status !== 'Inscripciones Abiertas'}
                                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${t.status === 'Inscripciones Abiertas'
                                            ? 'bg-[var(--color-secondary)] hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {t.status === 'Inscripciones Abiertas' ? 'Inscribirse' : 'No Disponible'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment History Placeholder */}
            <div className="mt-12">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Mis Inscripciones</h2>
                <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200 text-slate-400 hidden">
                    No tienes inscripciones activas.
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-4 font-medium">Torneo</th>
                                <th className="p-4 font-medium">Fecha Pago</th>
                                <th className="p-4 font-medium">Monto</th>
                                <th className="p-4 font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="p-4 font-medium text-slate-700">Nacional Apertura 2025</td>
                                <td className="p-4 text-slate-500">10 Mar 2025</td>
                                <td className="p-4 text-slate-500">$25.000</td>
                                <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">PAGADO</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
