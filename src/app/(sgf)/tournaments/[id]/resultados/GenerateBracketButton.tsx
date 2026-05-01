"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Trophy, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateKnockoutPhaseAction } from "./actions";

interface GenerateBracketButtonProps {
  tournamentId: string;
  hasPendingMatches: boolean;
  hasExistingBracket: boolean;
}

export default function GenerateBracketButton({
  tournamentId,
  hasPendingMatches,
  hasExistingBracket
}: GenerateBracketButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (hasPendingMatches) {
      toast.error("No se puede generar el cuadro. Hay partidas pendientes.");
      return;
    }

    setIsPending(true);
    try {
      const result = await generateKnockoutPhaseAction(tournamentId);
      
      if (result.success) {
        toast.success("Cuadro generado exitosamente con Fase de Ajuste.");
        router.push(`/tournaments/${tournamentId}/llaves`);
        router.refresh();
      } else {
        toast.error(result.error || "Error al generar el cuadro.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setIsPending(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={hasExistingBracket || isPending}
        className={`w-full py-4 bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 group ${
          hasExistingBracket ? "opacity-50 cursor-not-allowed grayscale" : ""
        }`}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GitBranch className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        )}
        {hasExistingBracket ? "Cuadro ya generado" : "Generar Cuadro (Fase Ajuste)"}
      </button>

      {/* Modal de Confirmación Premium */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Trophy className="w-8 h-8 text-indigo-400" />
            </div>
            
            <h3 className="text-xl font-black text-white text-center uppercase tracking-tight mb-2">
              Generar Cuadro Final
            </h3>
            <p className="text-slate-400 text-sm text-center leading-relaxed mb-8">
              Esto cerrará la fase de grupos y generará las llaves de eliminación directa aplicando la <span className="text-indigo-400 font-bold">Fase de Ajuste</span> oficial de Fechillar.
            </p>

            {hasPendingMatches && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-8 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-[11px] text-rose-300 leading-tight font-bold">
                  ATENCIÓN: Tienes partidas pendientes. Debes completarlas antes de proceder.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={hasPendingMatches || isPending}
                className="py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Generando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
