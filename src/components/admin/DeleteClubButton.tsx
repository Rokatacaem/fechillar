"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle, X, Users } from "lucide-react";
import { deleteClub } from "@/app/admin/clubes/actions";
import { useRouter } from "next/navigation";

interface DeleteClubButtonProps {
    clubId: string;
    clubName: string;
    playerCount: number;
}

export function DeleteClubButton({ clubId, clubName, playerCount }: DeleteClubButtonProps) {
    const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Bloqueo duro: si tiene jugadores no se puede eliminar
    if (playerCount > 0) {
        return (
            <div
                className="flex items-center gap-1 text-slate-600 cursor-not-allowed"
                title={`No se puede eliminar: tiene ${playerCount} jugador(es)`}
            >
                <Users className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">{playerCount}</span>
            </div>
        );
    }

    const handleConfirm = async () => {
        setStep("loading");
        const res = await deleteClub(clubId);
        if (res.success) {
            router.refresh();
        } else {
            setError(res.error ?? "Error al eliminar");
            setStep("idle");
        }
    };

    if (step === "confirm") {
        return (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <button
                    onClick={handleConfirm}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                >
                    <AlertTriangle className="w-3 h-3" />
                    ¿Confirmar?
                </button>
                <button
                    onClick={() => { setStep("idle"); setError(null); }}
                    className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-0.5">
            {error && <p className="text-[9px] text-red-400">{error}</p>}
            <button
                onClick={() => {
                    setStep("confirm");
                    setTimeout(() => setStep(p => p === "confirm" ? "idle" : p), 5000);
                }}
                disabled={step === "loading"}
                title={`Eliminar ${clubName}`}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
            >
                {step === "loading"
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                }
            </button>
        </div>
    );
}
