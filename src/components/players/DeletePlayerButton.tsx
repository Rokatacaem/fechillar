"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deletePlayer } from "@/app/(sgf)/players/actions";
import { toast } from "sonner";

interface DeletePlayerButtonProps {
  playerId: string;
  playerName: string;
  onDeleted: () => void;
}

export function DeletePlayerButton({ playerId, playerName, onDeleted }: DeletePlayerButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePlayer(playerId);
      toast.success(`${playerName} eliminado del padrón`);
      onDeleted();
    } catch (e: any) {
      toast.error(e.message ?? "Error al eliminar el jugador");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">¿Eliminar?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[10px] font-black px-2 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sí"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/30 hover:bg-slate-500/20 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Eliminar ${playerName}`}
      className="p-2 rounded-xl text-red-500/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
