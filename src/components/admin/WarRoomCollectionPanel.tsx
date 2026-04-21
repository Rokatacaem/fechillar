"use client";

import { forceEnrollmentOverride } from "@/actions/enrollment-actions";

export default function WarRoomCollectionPanel({ enrollments }: { enrollments: any[] }) {
    
    const handleOverride = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de perdonar la deuda y forzar la inscripción de ${name}?`)) return;
        
        try {
            const result = await forceEnrollmentOverride(id);
            if (result.success) {
                alert("Override ejecutado con éxito.");
            } else {
                alert("Error: " + result.error);
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-full flex flex-col">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-6 border-b border-emerald-900/50 pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Recaudación en Tiempo Real (Sede/Federación)
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {enrollments.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">Sin inscripciones pendientes de validación central.</p>
                ) : (
                    enrollments.map(e => (
                        <div key={e.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center group">
                            <div>
                                <div className="font-bold text-white text-sm">{e.user.name}</div>
                                <div className="text-[10px] text-slate-500 uppercase">
                                    {e.tournament?.name || 'Torneo S/N'} • <span className="text-amber-500 font-bold">
                                        {(e as any).user?.playerProfile?.club?.slug || (e as any).club?.slug || 'SgF'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-black ${e.paymentStatus === 'PAID' ? 'bg-emerald-950 text-emerald-500' : 'bg-rose-950 text-rose-500'}`}>
                                    {e.paymentStatus}
                                </span>
                                
                                {e.paymentStatus === 'PENDING' && (
                                    <button 
                                        onClick={() => handleOverride(e.id, e.user.name)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-bold px-2 py-1 rounded"
                                    >
                                        Override
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-end">
                <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase">Total Recaudado (Estimado)</div>
                    <div className="text-2xl font-black text-emerald-400">
                        ${enrollments.filter(e => e.paymentStatus === 'PAID').length * 15000} {/* Valor ejemplo por inscripción */}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-slate-500 uppercase">Tasa de Pago</div>
                    <div className="text-sm font-bold text-white">
                        {Math.round((enrollments.filter(e => e.paymentStatus === 'PAID').length / enrollments.length || 0) * 100)}%
                    </div>
                </div>
            </div>
        </section>
    );
}
