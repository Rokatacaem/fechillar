"use client";

import React, { useTransition } from "react";
import { validateMembershipQuick } from "@/actions/census-actions";
import { CreditCard, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface QuickValidateButtonProps {
    playerId: string;
    currentStatus: "GREEN" | "AMBER" | "RED";
}

export function QuickValidateButton({ playerId, currentStatus }: QuickValidateButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleRenew = () => {
        // En lugar de confirm(), usamos un estado de UI si fuera necesario, 
        // pero para "Quick" vamos directo con feedback visual.
        setError(null);
        setSuccess(false);

        startTransition(async () => {
            try {
                const res = await validateMembershipQuick(playerId, 15000); 
                if (res.success) {
                    setSuccess(true);
                    toast.success("Habilitación exitosa", {
                        description: `Válida hasta ${new Date(res.validUntil!).toLocaleDateString()}`
                    });
                } else {
                    toast.error("Fallo de validación", {
                        description: res.error || "Error desconocido en el servidor"
                    });
                }
            } catch (err: any) {
                toast.error("Error de conexión", {
                    description: err.message
                });
            }
        });
    };

    if (currentStatus === "GREEN" || success) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest animate-in zoom-in duration-300">
                <CheckCircle className="w-4 h-4" />
                Habilitado
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 min-w-[120px]">
            <button
                onClick={handleRenew}
                disabled={isPending}
                className={`
                    w-full flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95
                    ${isPending 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}
                `}
            >
                {isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Validando...
                    </>
                ) : (
                    <>
                        <CreditCard className="w-4 h-4" />
                        {currentStatus === "AMBER" ? "Renovar" : "Habilitar"}
                    </>
                )}
            </button>
        </div>
    );
}
