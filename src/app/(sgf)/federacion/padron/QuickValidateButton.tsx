"use client";

import React, { useTransition } from "react";
import { validateMembershipQuick } from "@/actions/census-actions";
import { CreditCard, Loader2, CheckCircle } from "lucide-react";

interface QuickValidateButtonProps {
    playerId: string;
    currentStatus: "GREEN" | "AMBER" | "RED";
}

export function QuickValidateButton({ playerId, currentStatus }: QuickValidateButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleRenew = () => {
        if (confirm("¿Confirmas la renovación de membresía por 1 año y el pago del arancel estándar?")) {
            startTransition(async () => {
                const res = await validateMembershipQuick(playerId, 15000); // Monto estándar temporal
                if (res.success) {
                    alert(`✅ Membresía renovada con éxito hasta ${new Date(res.validUntil!).toLocaleDateString()}`);
                } else {
                    alert(`❌ Error: ${res.error}`);
                }
            });
        }
    };

    if (currentStatus === "GREEN") {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle className="w-4 h-4" />
                Validado
            </div>
        );
    }

    return (
        <button
            onClick={handleRenew}
            disabled={isPending}
            className={`
                flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95
                ${isPending 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}
            `}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <CreditCard className="w-4 h-4" />
            )}
            {currentStatus === "AMBER" ? "Renovar" : "Habilitar"}
        </button>
    );
}
