"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────
// GENERACIÓN DE GRUPOS (SQL directo para bypasear Prisma Client)
// ─────────────────────────────────────────────────────────

export async function generateGroups(tournamentId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!["SUPERADMIN", "FEDERATION_ADMIN"].includes(role)) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true, config: true }
        });
        if (!tournament) return { success: false, error: "Torneo no encontrado" };

        const config = tournament.config as any;
        const groupSize: number = config?.groups?.size ?? 4;

        // Leer inscritos con SQL directo (evita el tipo Prisma desactualizado)
        const registrations = await prisma.$queryRaw<{ id: string; registered_points: number }[]>`
            SELECT id, "registeredPoints" as registered_points
            FROM "TournamentRegistration"
            WHERE "tournamentId" = ${tournamentId}
              AND status IN ('APPROVED', 'PENDING')
            ORDER BY "registeredPoints" DESC, "registeredAt" ASC
        `;

        const total = registrations.length;
        if (total < 2) {
            return { success: false, error: `Se necesitan al menos 2 jugadores. Encontrados: ${total}` };
        }

        const numGroups = Math.ceil(total / groupSize);
        console.log(`[generateGroups] ${total} jugadores → ${numGroups} grupos de ~${groupSize}`);

        // Limpiar groupId existentes (SQL directo)
        await prisma.$executeRaw`
            UPDATE "TournamentRegistration"
            SET "groupId" = NULL
            WHERE "tournamentId" = ${tournamentId}
        `;

        // Eliminar grupos anteriores
        await prisma.tournamentGroup.deleteMany({ where: { tournamentId } });

        // Crear grupos con Prisma
        const createdGroups: { id: string }[] = [];
        for (let i = 0; i < numGroups; i++) {
            const g = await prisma.tournamentGroup.create({
                data: {
                    tournamentId,
                    name: `${i + 1}`,
                    order: i + 1, // Asignar orden numérico
                    tieBreakType: "PGP"
                },
                select: { id: true }
            });
            createdGroups.push(g);
        }

        // Distribución serpentina + asignación SQL directa
        for (let idx = 0; idx < registrations.length; idx++) {
            const row = Math.floor(idx / numGroups);
            const col = row % 2 === 0
                ? idx % numGroups
                : numGroups - 1 - (idx % numGroups);
            const groupId = createdGroups[col].id;
            const regId = registrations[idx].id;

            await prisma.$executeRaw`
                UPDATE "TournamentRegistration"
                SET "groupId" = ${groupId},
                    "groupOrder" = ${row + 1}
                WHERE id = ${regId}
            `;
        }

        revalidatePath(`/tournaments/${tournamentId}/grupos`);
        return { success: true, numGroups, total };

    } catch (err: any) {
        console.error("[generateGroups] Error:", err);
        return { success: false, error: err?.message ?? "Error desconocido" };
    }
}

// ─────────────────────────────────────────────────────────
// MOVER JUGADOR ENTRE GRUPOS
// ─────────────────────────────────────────────────────────

export async function movePlayerToGroup(registrationId: string, targetGroupId: string | null) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!["SUPERADMIN", "FEDERATION_ADMIN"].includes(role)) {
        return { success: false, error: "No autorizado" };
    }

    try {
        if (targetGroupId) {
            // Al mover a un nuevo grupo, lo ponemos al final por defecto
            const maxOrder = await prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(*) as count FROM "TournamentRegistration" WHERE "groupId" = ${targetGroupId}
            `;
            const nextOrder = Number(maxOrder[0].count) + 1;

            await prisma.$executeRaw`
                UPDATE "TournamentRegistration"
                SET "groupId" = ${targetGroupId},
                    "groupOrder" = ${nextOrder}
                WHERE id = ${registrationId}
            `;
        } else {
            await prisma.$executeRaw`
                UPDATE "TournamentRegistration"
                SET "groupId" = NULL,
                    "groupOrder" = 0
                WHERE id = ${registrationId}
            `;
        }

        const regs = await prisma.$queryRaw<{ tournamentId: string }[]>`
            SELECT "tournamentId" FROM "TournamentRegistration" WHERE id = ${registrationId}
        `;
        if (regs[0]) revalidatePath(`/tournaments/${regs[0].tournamentId}/grupos`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message };
    }
}

// ─────────────────────────────────────────────────────────
// RENOMBRAR GRUPO
// ─────────────────────────────────────────────────────────

export async function renameGroup(groupId: string, name: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!["SUPERADMIN", "FEDERATION_ADMIN"].includes(role)) {
        return { success: false, error: "No autorizado" };
    }

    const group = await prisma.tournamentGroup.update({
        where: { id: groupId },
        data: { name: name.trim() }
    });

    revalidatePath(`/tournaments/${group.tournamentId}/grupos`);
    return { success: true };
}

// ─────────────────────────────────────────────────────────
// REORDENAR JUGADOR DENTRO DEL GRUPO
// ─────────────────────────────────────────────────────────

export async function movePlayerOrder(registrationId: string, direction: "up" | "down") {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!["SUPERADMIN", "FEDERATION_ADMIN"].includes(role)) {
        return { success: false, error: "No autorizado" };
    }

    try {
        // Obtener datos actuales
        const current = await prisma.$queryRaw<{ id: string; groupId: string; groupOrder: number; tournamentId: string }[]>`
            SELECT id, "groupId", "groupOrder", "tournamentId" 
            FROM "TournamentRegistration" 
            WHERE id = ${registrationId}
        `;
        
        if (!current[0] || !current[0].groupId) return { success: false, error: "Jugador no está en un grupo" };
        
        const { groupId, groupOrder, tournamentId } = current[0];
        const newOrder = direction === "up" ? groupOrder - 1 : groupOrder + 1;
        
        if (newOrder < 1) return { success: false, error: "Ya está en la primera posición" };

        // Buscar el jugador que está en la posición destino para intercambiar
        const target = await prisma.$queryRaw<{ id: string }[]>`
            SELECT id FROM "TournamentRegistration" 
            WHERE "groupId" = ${groupId} AND "groupOrder" = ${newOrder}
        `;

        if (target[0]) {
            // Swap
            await prisma.$executeRaw`UPDATE "TournamentRegistration" SET "groupOrder" = ${groupOrder} WHERE id = ${target[0].id}`;
            await prisma.$executeRaw`UPDATE "TournamentRegistration" SET "groupOrder" = ${newOrder} WHERE id = ${registrationId}`;
        } else {
            // Si no hay nadie (raro), solo actualizar el actual si no es down
            if (direction === "up") {
                await prisma.$executeRaw`UPDATE "TournamentRegistration" SET "groupOrder" = ${newOrder} WHERE id = ${registrationId}`;
            }
        }

        revalidatePath(`/tournaments/${tournamentId}/grupos`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message };
    }
}

// ─────────────────────────────────────────────────────────
// DATOS PARA LA VISTA (SQL directo para groupId)
// ─────────────────────────────────────────────────────────

export async function getGroupsWithPlayers(tournamentId: string) {
    // Leer grupos con SQL directo para evitar errores de validación de Prisma Client desactualizado
    const groups = await prisma.$queryRaw<{ id: string; name: string; tieBreakType: string; order: number }[]>`
        SELECT id, name, "tieBreakType", "order"
        FROM "TournamentGroup"
        WHERE "tournamentId" = ${tournamentId}
        ORDER BY "order" ASC
    `;

    // Leer asignaciones de jugadores via SQL
    const allRegs = await prisma.$queryRaw<{
        reg_id: string;
        group_id: string | null;
        registered_points: number;
        player_id: string;
        first_name: string | null;
        last_name: string | null;
        rut: string | null;
        federation_id: string | null;
        user_name: string | null;
        club_name: string | null;
        avg: number | null;
        group_order: number | null;
    }[]>`
        SELECT
            r.id                    AS reg_id,
            r."groupId"             AS group_id,
            r."groupOrder"          AS group_order,
            r."registeredPoints"    AS registered_points,
            p.id                    AS player_id,
            p."firstName"           AS first_name,
            p."lastName"            AS last_name,
            p."rut"                 AS rut,
            p."federationId"        AS federation_id,
            u."name"                AS user_name,
            c."name"                AS club_name,
            rk."average"            AS avg
        FROM "TournamentRegistration" r
        JOIN "PlayerProfile" p ON p.id = r."playerId"
        LEFT JOIN "User" u ON u.id = p."userId"
        LEFT JOIN "Club" c ON c.id = p."tenantId"
        LEFT JOIN "Ranking" rk ON rk."playerId" = p.id
        WHERE r."tournamentId" = ${tournamentId}
          AND r.status IN ('APPROVED', 'PENDING')
        ORDER BY r."groupId" ASC, r."groupOrder" ASC, r."registeredPoints" DESC, r."registeredAt" ASC
    `;

    // Normalizar y agrupar
    const normalize = (row: typeof allRegs[0]) => ({
        id: row.reg_id,
        registeredPoints: row.registered_points,
        player: {
            id: row.player_id,
            firstName: row.first_name,
            lastName: row.last_name,
            rut: row.rut,
            federationId: row.federation_id,
            user: row.user_name ? { name: row.user_name } : null,
            club: row.club_name ? { name: row.club_name } : null,
            rankings: row.avg != null ? [{ average: Number(row.avg), points: 0 }] : []
        },
        groupOrder: row.group_order
    });

    const groupsWithRegs = groups.map(g => ({
        ...g,
        registrations: allRegs
            .filter(r => r.group_id === g.id)
            .map(normalize)
    }));

    const unassigned = allRegs
        .filter(r => r.group_id === null)
        .map(normalize);

    return { groups: groupsWithRegs, unassigned };
}
