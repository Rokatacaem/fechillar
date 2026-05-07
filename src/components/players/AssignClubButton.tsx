"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditPlayerDialog } from "./EditPlayerDialog";

interface AssignClubButtonProps {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    rut: string | null;
    tenantId: string | null;
    gender: string | null;
    photoUrl: string | null;
  };
  clubs: { id: string; name: string }[];
}

export function AssignClubButton({ player, clubs }: AssignClubButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const hasClub = !!player.tenantId;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`text-sm font-bold px-3 py-2 rounded-xl transition-colors border ${
          hasClub
            ? "text-slate-400 hover:text-white bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/20"
            : "text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"
        }`}
      >
        {hasClub ? "Cambiar Club" : "Asignar Club"}
      </button>

      {open && (
        <EditPlayerDialog
          player={{
            id: player.id,
            name: `${player.firstName} ${player.lastName}`,
            email: player.email ?? "",
            rut: player.rut,
            clubId: player.tenantId,
            gender: player.gender,
            photoUrl: player.photoUrl,
          }}
          isOpen={open}
          onClose={() => {
            setOpen(false);
            router.refresh();
          }}
          clubs={clubs}
        />
      )}
    </>
  );
}
