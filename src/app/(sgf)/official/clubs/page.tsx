export default function ClubsPage() {
    const clubs = [
        { id: 1, name: "Club Billar Santiago", city: "Santiago", members: 45, status: "Activo" },
        { id: 2, name: "Club Temuco", city: "Temuco", members: 28, status: "Activo" },
        { id: 3, name: "Club Copiapó", city: "Copiapó", members: 0, status: "Pendiente" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Gestión de Clubes</h1>
                <button className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold">
                    Exportar Lista
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                    <div key={club.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                        {club.status === 'Pendiente' && (
                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                                Requiere Validación
                            </div>
                        )}

                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
                                🎱
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{club.name}</h3>
                                <p className="text-sm text-slate-500">{club.city}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                            <div className="text-sm">
                                <span className="font-bold text-slate-700">{club.members}</span> <span className="text-slate-400">Jugadores</span>
                            </div>
                            {club.status === 'Pendiente' ? (
                                <button className="px-3 py-1 bg-[var(--color-primary)] text-white text-xs font-bold rounded hover:bg-blue-900">
                                    Validar Ingreso
                                </button>
                            ) : (
                                <button className="text-slate-400 hover:text-[var(--color-primary)] text-sm font-medium">
                                    Ver Detalles
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
