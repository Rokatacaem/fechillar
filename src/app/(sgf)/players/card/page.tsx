export default function PlayerCard() {
    return (
        <div className="max-w-md mx-auto py-12">
            <h1 className="text-2xl font-bold text-slate-800 text-center mb-8">Carnet Digital</h1>

            <div className="relative w-full aspect-[3/4.5] bg-gradient-to-br from-[var(--color-primary)] to-slate-900 rounded-3xl shadow-2xl p-8 text-white flex flex-col items-center justify-between overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

                {/* Header */}
                <div className="w-full flex justify-between items-center z-10">
                    <span className="font-bold tracking-widest text-sm uppercase">Fechillar</span>
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-xs">CHL</div>
                </div>

                {/* Photo & Info */}
                <div className="z-10 flex flex-col items-center w-full">
                    <div className="w-32 h-32 bg-slate-200 rounded-full border-4 border-white/20 mb-6 shadow-inner">
                        {/* Placeholder Avatar */}
                    </div>
                    <h2 className="text-2xl font-bold text-center">Alejandro Carvajal</h2>
                    <p className="text-blue-200 text-sm mt-1">Club Billar Santiago</p>

                    <div className="mt-6 flex gap-4 text-center">
                        <div>
                            <div className="text-xs text-slate-400 uppercase">Categoría</div>
                            <div className="font-bold">Todo Competidor</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 uppercase">Socio</div>
                            <div className="font-bold">#9482</div>
                        </div>
                    </div>
                </div>

                {/* QR Code */}
                <div className="z-10 bg-white p-3 rounded-xl shadow-lg mt-4">
                    <div className="w-40 h-40 bg-slate-900"></div>
                </div>

                {/* Footer */}
                <div className="z-10 w-full text-center mt-6 pt-4 border-t border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Válido hasta Diciembre 2026
                    </p>
                </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                <button className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg shadow-lg hover:bg-blue-900 transition-colors flex items-center gap-2">
                    <span>⬇</span> Descargar PDF
                </button>
                <button className="px-6 py-3 bg-white text-slate-700 rounded-lg shadow border border-slate-200 hover:bg-slate-50 transition-colors">
                    Compartir
                </button>
            </div>
        </div>
    );
}
