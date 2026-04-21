"use client";

import { useState } from 'react';

// Si Shadcn/ui estuviera plenamente ensamblado usaríamos Dialog, Input, Label.
// Aquí diseñamos un Fallback Component limpio utilizando Tailwind para fácil portabilidad.

export default function ManualMatchEntry({ matchId }: { matchId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        
        // Simulación de Server Action:
        // await submitManualResult(matchId, {
        //     homeScore: Number(formData.get('homeScore')),
        //     awayScore: Number(formData.get('awayScore')),
        //     ...
        // });
        
        setTimeout(() => {
            setIsSaving(false);
            setIsOpen(false);
            alert("✅ Ingreso manual inyectado con éxito al sistema central.");
        }, 800);
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-slate-700 shadow-sm"
            >
                Ingreso Manual de Resultado
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                        
                        <div className="bg-rose-950/30 border-b border-rose-900/50 p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-rose-500 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    Carga Rápida / Fallback
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">Este ingreso sobrescribirá los datos del Árbitro en Base de Datos.</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white pb-6">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Jugador 1 */}
                                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                                    <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-2">Local (J1)</h4>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Carambolas Finales</label>
                                        <input required name="homeScore" type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Entradas Consumidas</label>
                                        <input required name="homeInnings" type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mejor Serie (HR)</label>
                                        <input required name="homeHighRun" type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                    </div>
                                </div>

                                {/* Jugador 2 */}
                                <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                                    <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-2">Visitante (J2)</h4>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Carambolas Finales</label>
                                        <input required name="awayScore" type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Entradas Consumidas</label>
                                        <input required name="awayInnings" type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mejor Serie (HR)</label>
                                        <input required name="awayHighRun" type="number" min="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-70 text-white rounded-xl font-bold tracking-wide transition-colors flex items-center justify-center">
                                    {isSaving ? 'Inyectando...' : 'Fijar Resultados'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
