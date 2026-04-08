export default function MinutesPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Actas de Directorio</h1>
                <button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-blue-900 transition-colors shadow-sm flex items-center gap-2 text-sm font-semibold">
                    <span>+</span> Nueva Acta
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-medium">Fecha</th>
                            <th className="p-4 font-medium">Título / Descripción</th>
                            <th className="p-4 font-medium">Tipo</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="group hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-slate-500">15 Ene 2025</td>
                            <td className="p-4">
                                <div className="font-semibold text-slate-700">Reunión Ordinaria de Directorio</div>
                            </td>
                            <td className="p-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">Ordinaria</span>
                            </td>
                            <td className="p-4 text-right">
                                <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Descargar PDF</button>
                            </td>
                        </tr>
                        <tr className="group hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-slate-500">20 Dic 2024</td>
                            <td className="p-4">
                                <div className="font-semibold text-slate-700">Cierre Presupuestario 2024</div>
                            </td>
                            <td className="p-4">
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold uppercase">Extraordinaria</span>
                            </td>
                            <td className="p-4 text-right">
                                <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Descargar PDF</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
