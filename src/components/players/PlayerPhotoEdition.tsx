"use client";

import React, { useState } from "react";
import { User, Camera } from "lucide-react";
import { UpdatePlayerPhotoDialog } from "./UpdatePlayerPhotoDialog";

interface PlayerPhotoEditionProps {
    playerId: string;
    playerName: string;
    initialPhotoUrl: string | null;
}

export function PlayerPhotoEdition({ playerId, playerName, initialPhotoUrl }: PlayerPhotoEditionProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <div 
                onClick={() => setIsDialogOpen(true)}
                className="group relative w-40 h-40 md:w-48 md:h-48 rounded-[2rem] bg-slate-800 border-2 border-white/10 overflow-hidden shadow-xl shrink-0 flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all"
            >
                {initialPhotoUrl ? (
                    <img src={initialPhotoUrl} alt={playerName} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                    <User className="w-20 h-20 text-slate-600 transition-transform group-hover:scale-110" />
                )}

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-emerald-600 p-3 rounded-2xl text-slate-950 shadow-xl">
                        <Camera className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <UpdatePlayerPhotoDialog 
                playerId={playerId}
                playerName={playerName}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </>
    );
}
