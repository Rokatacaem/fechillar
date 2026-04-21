"use client";

import React, { useState } from "react";
import { 
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Eye, Loader2, Shield } from "lucide-react";
import { deletePlayer } from "@/app/(sgf)/players/actions";
import { EditPlayerDialog } from "./EditPlayerDialog";
import Link from "next/link";

interface PlayerTableActionsProps {
    player: {
        id: string;
        name: string;
        email: string;
        rut: string | null;
        clubId: string | null;
        gender: string | null;
        photoUrl: string | null;
    };
    canEdit: boolean;
    clubs: { id: string; name: string }[];
}

export function PlayerTableActions({ player, canEdit, clubs }: PlayerTableActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar a ${player.name}?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deletePlayer(player.id);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!canEdit) return (
        <Link href={`/players/${player.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                <Eye className="h-4 w-4" />
            </Button>
        </Link>
    );

    return (
        <div className="flex items-center justify-end gap-1">
            <Popover>
                <PopoverTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 bg-[#0a1224] border-white/10 p-2 text-slate-300 rounded-2xl shadow-2xl">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 py-2">Gestión</p>
                        
                        <Link href={`/players/${player.id}`}>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold hover:bg-white/5 rounded-lg transition-colors">
                                <Eye className="h-4 w-4 text-emerald-500" /> Ver Perfil
                            </button>
                        </Link>

                        <button 
                            onClick={() => setIsEditDialogOpen(true)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <Edit className="h-4 w-4 text-blue-500" /> Editar Datos
                        </button>

                        <div className="h-px bg-white/5 my-1" />

                        <button 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Eliminar Socio
                        </button>
                    </div>
                </PopoverContent>
            </Popover>

            <EditPlayerDialog 
                player={player}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                clubs={clubs}
            />
        </div>
    );
}
