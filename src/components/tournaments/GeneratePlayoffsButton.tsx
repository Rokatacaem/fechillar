"use client";

import { useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generatePlayoffsFromGroups } from "@/app/(sgf)/tournaments/matchmaking/actions";

export function GeneratePlayoffsButton({ tournamentId }: { tournamentId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGenerate = async () => {
        try {
            setLoading(true);
            const res = await generatePlayoffsFromGroups(tournamentId);
            
            if (res.success) {
                toast.success(res.message || "¡Cuadro generado con éxito!");
                router.refresh();
            } else {
                toast.error(res.error || "Error al generar el cuadro.");
            }
        } catch (err: any) {
            toast.error("Ocurrió un error inesperado.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center gap-2 mx-auto"
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando Cuadro...
                </>
            ) : (
                <>
                    <Trophy className="w-4 h-4" />
                    Finalizar Grupos y Generar Cuadro
                </>
            )}
        </button>
    );
}
