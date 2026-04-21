import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const rankings = await prisma.ranking.findMany();
        
        // Agrupar por jugador y disciplina
        const grouped: Record<string, any[]> = {};
        for (const r of rankings) {
            const key = `${r.playerId}_${r.discipline}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        }

        let deletedCount = 0;

        for (const key in grouped) {
            const group = grouped[key];
            if (group.length > 1) {
                // Ordenar por puntos descendente, para quedarnos con el que tiene más puntos (el real)
                group.sort((a, b) => b.points - a.points);
                
                // El primero es el bueno, los demás son basura generada por el bug
                const [best, ...garbage] = group;

                for (const g of garbage) {
                    // Si el basura tiene 0 puntos y categoría PROMO, es 100% culpa del bug
                    if (g.points === 0 && g.category === "PROMO") {
                        await prisma.ranking.delete({ where: { id: g.id } });
                        deletedCount++;
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Se han limpiado ${deletedCount} rankings duplicados generados por el bug de guardado.` 
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
