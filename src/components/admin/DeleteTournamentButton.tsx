"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteTournament } from "@/app/(sgf)/tournaments/nuevo/actions";
import { toast } from "sonner";

interface DeleteTournamentButtonProps {
    tournamentId: string;
    tournamentName: string;
}

export function DeleteTournamentButton({ tournamentId, tournamentName }: DeleteTournamentButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!showConfirm) {
            setShowConfirm(true);
            // Auto-cancelar tras 3 segundos si no se confirma
            setTimeout(() => setShowConfirm(false), 3000);
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteTournament(tournamentId);
            if (result.success) {
                toast.success("Torneo Eliminado", {
                    description: `El torneo "${tournamentName}" ha sido retirado del calendario.`
                });
            } else {
                toast.error("Error al eliminar", { description: result.error });
                setShowConfirm(false);
            }
        } catch (err: any) {
            toast.error("Error de comunicación", { description: err.message });
            setShowConfirm(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`p-2 rounded-lg transition-all border relative z-50 shadow-lg active:scale-95 flex items-center gap-2 group ${
                showConfirm 
                ? "bg-red-600 text-white border-red-400 px-4 scale-110" 
                : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
            } ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
            title={showConfirm ? "Haz clic de nuevo para confirmar" : "Eliminar Torneo"}
        >
            {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : showConfirm ? (
                <>
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">¿Confirmar?</span>
                </>
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </button>
    );
}
