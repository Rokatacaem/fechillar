"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { removePlayerFromTournament } from "@/app/(sgf)/tournaments/inscripciones/actions";
import { useRouter } from "next/navigation";

export function RemoveRegistrationButton({ registrationId }: { registrationId: string }) {
    const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleClick = async () => {
        if (step === "idle") {
            setStep("confirm");
            // Auto-cancel confirmation after 4 seconds
            setTimeout(() => setStep(prev => prev === "confirm" ? "idle" : prev), 4000);
            return;
        }

        setStep("loading");
        setError(null);
        const res = await removePlayerFromTournament(registrationId);

        if (res.success) {
            router.refresh();
        } else {
            setError(res.error ?? "Error desconocido");
            setStep("idle");
        }
    };

    if (step === "confirm") {
        return (
            <div className="flex items-center gap-1.5">
                {error && <p className="text-[9px] text-red-400 max-w-[120px] text-right leading-tight">{error}</p>}
                <button
                    onClick={handleClick}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 animate-in fade-in duration-150"
                >
                    <AlertTriangle className="w-3 h-3" />
                    ¿Confirmar?
                </button>
                <button
                    onClick={() => setStep("idle")}
                    className="px-2 py-1.5 text-slate-500 hover:text-white text-[9px] font-bold rounded-lg transition-colors"
                >
                    No
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-0.5">
            {error && <p className="text-[9px] text-red-400 max-w-[130px] text-right leading-tight">{error}</p>}
            <button
                onClick={handleClick}
                disabled={step === "loading"}
                title="Retirar jugador del torneo"
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90 disabled:opacity-40"
            >
                {step === "loading"
                    ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    : <Trash2 className="w-4 h-4" />
                }
            </button>
        </div>
    );
}
