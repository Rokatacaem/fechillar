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

/**
 * Elimina la inscripción de un jugador en un torneo.
 * Bloqueado si el jugador ya tiene partidas con resultados registrados.
 */
export async function removePlayerFromTournament(registrationId: string) {
    const session = await auth();
    if (!session) return { success: false, error: "No autorizado" };

    const allowedRoles = ["SUPERADMIN", "FEDERATION_ADMIN", "CLUB_DELEGATE", "CLUB_ADMIN"];
    if (!allowedRoles.includes((session.user as any)?.role)) {
        return { success: false, error: "Sin permisos suficientes" };
    }

    try {
        const reg = await prisma.tournamentRegistration.findUnique({
            where: { id: registrationId },
            select: { tournamentId: true, playerId: true }
        });

        if (!reg) return { success: false, error: "Inscripción no encontrada" };

        // No permitir si el jugador ya tiene partidas con resultado
        const hasResults = await prisma.match.findFirst({
            where: {
                tournamentId: reg.tournamentId,
                OR: [{ homePlayerId: reg.playerId }, { awayPlayerId: reg.playerId }],
                homeScore: { not: null }
            }
        });

        if (hasResults) {
            return {
                success: false,
                error: "No se puede retirar: el jugador ya tiene resultados registrados en el torneo."
            };
        }

        await prisma.tournamentRegistration.delete({ where: { id: registrationId } });

        revalidatePath(`/tournaments/${reg.tournamentId}/inscripciones`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Inscribe múltiples jugadores simultáneamente.
 * Optimizado para reducir la cantidad de queries y evitar timeouts de transacción.
 */
export async function registerPlayersBulk(tournamentId: string, playerIds: string[]) {
    const session = await auth();
    if (!session || !session.user) throw new Error("No autorizado");

    if (!playerIds || playerIds.length === 0) return { success: true, addedCount: 0 };

    try {
        // 1. Obtener datos del torneo fuera de la transacción para reducir el tiempo de bloqueo
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { discipline: true, category: true }
        });
        if (!tournament) throw new Error("Torneo no encontrado");

        // 2. Ejecutar lógica en una sola transacción
        const results = await prisma.$transaction(async (tx) => {
            // A. Identificar quiénes ya están inscritos
            const existing = await tx.tournamentRegistration.findMany({
                where: {
                    tournamentId,
                    playerId: { in: playerIds }
                },
                select: { playerId: true }
            });
            const existingIds = new Set(existing.map(e => e.playerId));
            
            // Filtrar solo los nuevos
            const idsToRegister = playerIds.filter(id => !existingIds.has(id));
            if (idsToRegister.length === 0) return 0;

            // B. Obtener todos los rankings de una sola vez
            const rankings = await tx.ranking.findMany({
                where: {
                    playerId: { in: idsToRegister },
                    discipline: tournament.discipline,
                    category: tournament.category
                }
            });
            const rankingMap = new Map(rankings.map(r => [r.playerId, r.points]));

            // C. Inscribir (Prisma no tiene createMany que retorne IDs de forma portable, 
            // pero podemos usar una serie de promesas dentro del bloque tx)
            // IMPORTANTE: Al estar dentro de tx, se ejecutan secuencialmente o en paralelo 
            // pero bajo el mismo contexto de transacción.
            await Promise.all(idsToRegister.map(playerId => 
                tx.tournamentRegistration.create({
                    data: {
                        tournamentId,
                        playerId,
                        registeredPoints: rankingMap.get(playerId) ?? 0,
                        status: "APPROVED",
                        paymentStatus: "PENDING"
                    }
                })
            ));

            return idsToRegister.length;
        }, {
            timeout: 15000 // Aumentar timeout a 15s para lotes grandes
        });

        revalidatePath(`/tournaments/${tournamentId}/inscripciones`);
        return { success: true, addedCount: results };
    } catch (error: any) {
        console.error("Bulk registration error:", error);
        return { success: false, error: error.message || "Error al procesar el lote" };
    }
}
