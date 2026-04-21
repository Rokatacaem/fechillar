"use client";

import { useState } from "react";
import { validateManualPayment } from "@/actions/enrollment-actions";

interface ManualPaymentModalProps {
    targetId: string;
    targetName: string;
    type: "MEMBERSHIP" | "ENROLLMENT";
    onSuccess?: () => void;
    onClose: () => void;
}

export default function ManualPaymentModal({ 
    targetId, 
    targetName, 
    type, 
    onSuccess, 
    onClose 
}: ManualPaymentModalProps) {
    const [reference, setReference] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleConfirm = async () => {
        if (!confirmed) return;
        setIsSaving(true);
        try {
            const result = await validateManualPayment(targetId, type, reference);
            if (result.success) {
                alert("Pago validado correctamente.");
                onSuccess?.();
                onClose();
            } else {
                alert("Error: " + result.error);
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-white mb-2">Validación Manual de Pago</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Estás validando el pago de <span className="text-indigo-400 font-bold">{targetName}</span> por concepto de <span className="uppercase text-xs font-black px-1 bg-slate-800 rounded">{type}</span>.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Referencia / No. Operación (Opcional)</label>
                        <input 
                            type="text" 
                            value={reference} 
                            onChange={e => setReference(e.target.value)}
                            placeholder="Ej: Transf. 002341..."
                            className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex items-start gap-3 bg-rose-950/20 p-3 rounded-lg border border-rose-900/30">
                        <input 
                            type="checkbox" 
                            id="confirm-box"
                            className="mt-1"
                            checked={confirmed}
                            onChange={e => setConfirmed(e.target.checked)}
                        />
                        <label htmlFor="confirm-box" className="text-xs text-slate-300 leading-tight">
                            Confirmo bajo mi responsabilidad de Delegado que el jugador ha cancelado los fondos correspondientes.
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        disabled={!confirmed || isSaving}
                        onClick={handleConfirm}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-2 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        {isSaving ? "Validando..." : "Firmar Pago"}
                    </button>
                </div>
            </div>
        </div>
    );
}
