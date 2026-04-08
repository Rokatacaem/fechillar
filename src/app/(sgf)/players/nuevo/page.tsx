import React from "react";
import prisma from "@/lib/prisma";
import { PlayerForm } from "@/components/players/PlayerForm";

export default async function NewPlayerPage() {
    // 1. Obtener lista real de clubes para el selector
    const clubs = await prisma.club.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    return (
        <div className="min-h-screen">
            {/* El fondo bg-slate-950 ya viene del Layout SGF principal, 
                eliminamos cualquier contenedor blanco o bordes externos aquí */}
            <PlayerForm clubs={clubs} />
        </div>
    );
}