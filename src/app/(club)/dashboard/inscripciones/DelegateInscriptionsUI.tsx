"use client";

import { useState } from "react";
import ManualPaymentModal from "@/components/admin/ManualPaymentModal";

export default function DelegateInscriptionsUI({ players }: { players: any[] }) {
    const [selectedMembership, setSelectedMembership] = useState<{ id: string, name: string } | null>(null);

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-[#0b1120] border-b border-slate-800">
                        <tr>
                            <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-widest">Jugador</th>
                            <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-widest text-center">Estado Financiero</th>
                            <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-widest">Vencimiento</th>
                            <th className="p-4 text-xs font-black uppercase text-slate-500 tracking-widest text-right">Acciones de Caja</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {players.map(p => (
                            <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-white">{p.user.name}</div>
                                    <div className="text-xs text-slate-500 uppercase font-mono">{p.federationId || 'SIN LICENCIA'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`
                                            w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]
                                            bg-${p.standing.color}
                                            ${p.standing.status === 'GREEN' ? 'shadow-emerald-500/50' : p.standing.status === 'AMBER' ? 'shadow-amber-500/50' : 'shadow-rose-600/50'}
                                            ${p.standing.status !== 'RED' ? 'animate-pulse' : ''}
                                        `}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter text-${p.standing.color}`}>
                                            {p.standing.message}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm font-mono text-slate-400">
                                    {p.standing.validUntil ? new Date(p.standing.validUntil).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {p.standing.status === 'RED' && p.membershipId ? (
                                            <button 
                                                onClick={() => setSelectedMembership({ id: p.membershipId, name: p.user.name })}
                                                className="bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-600/30 text-emerald-500 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-lg"
                                            >
                                                Validar Pago
                                            </button>
                                        ) : (
                                            <button 
                                                disabled={p.standing.status === 'RED'}
                                                className={`
                                                    px-3 py-1 rounded-lg text-xs font-bold transition-all
                                                    ${p.standing.status !== 'RED' 
                                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20' 
                                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                                                `}
                                            >
                                                Inscribir Torneo
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedMembership && (
                <ManualPaymentModal 
                    targetId={selectedMembership.id}
                    targetName={selectedMembership.name}
                    type="MEMBERSHIP"
                    onClose={() => setSelectedMembership(null)}
                    onSuccess={() => {
                        // Revalidación se activa por server action revalidatePath
                        setSelectedMembership(null);
                    }}
                />
            )}
        </div>
    );
}
