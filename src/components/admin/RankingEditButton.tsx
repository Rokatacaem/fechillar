"use client";

import { useState } from "react";
import { RankingEditor } from "./RankingEditor";
import { useRouter } from "next/navigation";

interface RankingEditButtonProps {
  player: any;
  isSuper: boolean;
}

export function RankingEditButton({ player, isSuper }: RankingEditButtonProps) {
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const router = useRouter();

  if (!isSuper) return null;

  return (
    <>
      <button
        onClick={() => setEditingPlayer(player)}
        className="text-emerald-500 hover:text-emerald-400 text-sm font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 rounded-xl transition-colors border border-emerald-500/20"
      >
        Editar Ranking
      </button>

      {editingPlayer && (
        <RankingEditor
          player={editingPlayer}
          ranking={editingPlayer.rankings?.[0]}
          discipline="THREE_BAND"
          category="MASTER"
          onClose={() => setEditingPlayer(null)}
          onSuccess={() => {
            setEditingPlayer(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
