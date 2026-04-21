"use client";

import React, { useState } from "react";
import { UserPlus, ShieldAlert, Trash2, ShieldCheck, Mail } from "lucide-react";
import { UserSearchPalette } from "./UserSearchPalette";
import { assignDelegateToClub, revokeDelegate } from "@/app/admin/clubes/actions";

interface Delegate {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

interface ClubDelegateManagerProps {
    clubId: string;
    initialDelegates: Delegate[];
}

/**
 * Panel de Gestión de Autoridades en la Ficha Maestra.
 */
export function ClubDelegateManager({ clubId, initialDelegates }: ClubDelegateManagerProps) {
    const [delegates, setDelegates] = useState<Delegate[]>(initialDelegates);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    const handleAssign = async (user: { id: string; name: string }) => {
        if (confirm(`¿Confirmar ascenso táctico de ${user.name} como Delegado de este Club?`)) {
            setProcessing("assigning");
            const result = await assignDelegateToClub(user.id, clubId);
            
            if (result.success) {
                // Ideally we'd revalidate, but for UX we update optimistic state
                window.location.reload(); 
            } else {
                alert("Error: " + result.error);
            }
            setProcessing(null);
        }
    };

    const handleRevoke = async (userId: string, name: string) => {
        if (confirm(`¿REVOCAR PODERES a ${name}? El usuario será degradado a ROL CIUDADANO.`)) {
            setProcessing(userId);
            const result = await revokeDelegate(userId, clubId);
            if (result.success) {
                window.location.reload();
            } else {
                alert("Error: " + result.error);
            }
            setProcessing(null);
        }
    };

    return (
        <section className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <header className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Panel de Autoridades Locales
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase">Delegados validados con acceso a gestión regional</p>
                </div>
                
                <button 
                    onClick={() => setIsPaletteOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider"
                >
                    <UserPlus className="w-4 h-4" />
                    Asignar Delegado
                </button>
            </header>

            <div className="p-0">
                {delegates.length === 0 ? (
                    <div className="p-12 text-center border-b border-slate-800/50">
                        <ShieldAlert className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                            Vacío de Poder Detectado. <br /> Sin autoridades asignadas a esta sede.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-3 border-b border-slate-800">Operador</th>
                                <th className="px-6 py-3 border-b border-slate-800">Estado</th>
                                <th className="px-6 py-3 border-b border-slate-800 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {delegates.map((d) => (
                                <tr key={d.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                                {d.name?.substring(0, 2) || "U"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{d.name}</p>
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {d.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                                            Activo
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleRevoke(d.id, d.name || "Usuario")}
                                            className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                            disabled={processing === d.id}
                                            title="Revocar Poder"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <UserSearchPalette 
                isOpen={isPaletteOpen} 
                setIsOpen={setIsPaletteOpen} 
                onSelect={handleAssign}
            />
        </section>
    );
}
