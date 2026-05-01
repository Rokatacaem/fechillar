"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Verifica si un torneo tiene cupo y, de lo contrario, 
 * marca la inscripción como Lista de Espera.
 */
export async function manageRegistrationCapacity(tournamentId: string, registrationId: string) {
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { maxTables: true, playersPerTable: true }
    });

    if (!tournament) throw new Error("Torneo no encontrado");

    const capacity = tournament.maxTables * tournament.playersPerTable;

    // Contar registros activos (aprobados o pagados que NO están en waiting list)
    const activeCount = await prisma.tournamentRegistration.count({
        where: {
            tournamentId,
            isWaitingList: false,
            OR: [
                { status: "APPROVED" },
                { paymentStatus: "PAID" }
            ]
        }
    });

    if (activeCount >= capacity) {
        // Mover a lista de espera
        await prisma.tournamentRegistration.update({
            where: { id: registrationId },
            data: { isWaitingList: true, priority: activeCount + 1 }
        });

        // Trazabilidad en WaitingList model (opcional si se usa el flag, pero el usuario pidió modelo)
        const registration = await prisma.tournamentRegistration.findUnique({
            where: { id: registrationId }
        });

        if (registration) {
            await prisma.waitingList.create({
                data: {
                    tournamentId,
                    userId: registration.playerId, // Relacionamos con el PlayerId (que es el userId en PlayerProfile)
                    priority: activeCount + 1
                }
            });
        }
        
        return { status: "WAITING_LIST", message: "Torneo lleno. Jugador movido a lista de espera." };
    }

    return { status: "ACTIVE", message: "Jugador asignado a cuadro principal." };
}

/**
 * Reemplaza a un jugador en un partido específico por uno de la lista de espera.
 * Útil para inasistencias de último minuto en el War Room.
 */
export async function swapWithWaitingList(matchId: string, side: 'HOME' | 'AWAY', waitingUserId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'SUPERADMIN') {
        throw new Error("Solo los SuperAdmin pueden realizar reemplazos tácticos.");
    }

    const match = await prisma.match.findUnique({
        where: { id: matchId }
    });

    if (!match) throw new Error("Partido no encontrado");

    // 1. Obtener al nuevo jugador (desde la lista de espera)
    const player = await prisma.playerProfile.findUnique({
        where: { userId: waitingUserId },
        include: { rankings: { where: { discipline: 'THREE_BAND' } } }
    });

    if (!player) throw new Error("Jugador no encontrado en el sistema.");

    // 2. Realizar el SWAP en el match
    const newTarget = player.rankings?.[0]?.handicapTarget ?? 15;

    await prisma.match.update({
        where: { id: matchId },
        data: side === 'HOME' 
            ? { homePlayerId: player.id, homeTarget: newTarget }
            : { awayPlayerId: player.id, awayTarget: newTarget }
    });

    // 3. Registrar auditoría
    await prisma.auditLog.create({
        data: {
            action: "PLAYER_SWAP_WAITING_LIST",
            targetId: matchId,
            userId: session?.user?.id as string,
            details: `Reemplazado jugador en ${side} por ${player.id} desde lista de espera.`
        }
    });

    revalidatePath("/(sgf)/tournaments/[id]/cuadros", "page");
    return { success: true };
}
