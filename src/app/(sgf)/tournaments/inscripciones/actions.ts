"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function registerPlayer(tournamentId: string, playerId: string) {
    const session = await auth();
    
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    try {
        // 1. Obtener los detalles del torneo para saber la disciplina/categoría base (si aplica)
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });

        if (!tournament) throw new Error("Torneo no encontrado");

        // 2. Buscar si el jugador ya está inscrito
        const existing = await prisma.tournamentRegistration.findUnique({
            where: {
                tournamentId_playerId: {
                    tournamentId,
                    playerId
                }
            }
        });

        if (existing) {
             throw new Error("El jugador ya está inscrito en este torneo");
        }

        // 3. Buscar el ranking del jugador para esa disciplina para "congelar" los puntos.
        // Si no existe, los puntos registrados serán 0.
        const ranking = await prisma.ranking.findUnique({
            where: {
                playerId_discipline_category: {
                    playerId: playerId,
                    discipline: tournament.discipline,
                    category: tournament.category
                }
            }
        });

        const pointsToFreeze = ranking ? ranking.points : 0;

        // 4. Inscribir al jugador
        const registration = await prisma.tournamentRegistration.create({
            data: {
                tournamentId,
                playerId,
                registeredPoints: pointsToFreeze,
                status: "APPROVED", // Por defecto aprobado por inscripción directa de admin
                paid: false,
                paymentStatus: "PENDING"
            }
        });

        revalidatePath(`/tournaments/${tournamentId}/inscripciones`);
        return { success: true, registrationId: registration.id };

    } catch (error: any) {
        console.error("Error registering player:", error);
        return { success: false, error: error.message || "Error al inscribir jugador" };
    }
}
