"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────
// GENERACIÓN Y RESETEO DE GRUPOS
// ─────────────────────────────────────────────────────────

export async function resetGroups(tournamentId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!["SUPERADMIN", "FEDERATION_ADMIN"].includes(role)) {
        return { success: false, error: "No autorizado" };
    }

    try {
        await prisma.$executeRaw`UPDATE "TournamentRegistration" SET "groupId" = NULL WHERE "tournamentId" = ${tournamentId}`;
        await prisma.tournamentGroup.deleteMany({ where: { tournamentId } });
        
        revalidatePath(`/tournaments/${tournamentId}/grupos`);
        revalidatePath(`/tournaments/${tournamentId}/inscripciones`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

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

        // 1. Leer todos los inscritos con playerId en 1 query
        const registrations = await prisma.$queryRaw<{
            id: string;
            registered_points: number;
            preferred_turn: string | null;
            player_id: string;
        }[]>`
            SELECT id,
                   "registeredPoints" AS registered_points,
                   "preferredTurn"    AS preferred_turn,
                   "playerId"         AS player_id
            FROM "TournamentRegistration"
            WHERE "tournamentId" = ${tournamentId}
              AND status IN ('APPROVED', 'PENDING')
            ORDER BY "registeredPoints" DESC, "registeredAt" ASC
        `;

        const total = registrations.length;
        if (total < 2) {
            return { success: false, error: `Se necesitan al menos 2 jugadores. Encontrados: ${total}` };
        }

        // 2. Segmentar por turno
        const t1 = registrations.filter(r => r.preferred_turn === 'T1');
        const t2 = registrations.filter(r => r.preferred_turn === 'T2');
        const t3 = registrations.filter(r => r.preferred_turn === 'T3');
        const flex = registrations.filter(r => !['T1', 'T2', 'T3'].includes(r.preferred_turn || ''));

        console.log(`[generateGroups] T1:${t1.length}, T2:${t2.length}, T3:${t3.length}, Flex:${flex.length}`);

        // 3. Rellenar turnos con comodines hasta 18
        const blocks = [
            { name: 'T1', label: '10:00 hrs', players: t1 },
            { name: 'T2', label: '13:00 hrs', players: t2 },
            { name: 'T3', label: '18:00 hrs', players: t3 },
        ];
        let flexIdx = 0;
        for (const b of blocks) {
            while (b.players.length < 18 && flexIdx < flex.length) {
                b.players.push(flex[flexIdx++]);
            }
        }

        // 4. Limpiar datos anteriores (3 queries)
        await prisma.$executeRaw`
            UPDATE "TournamentRegistration" SET "groupId" = NULL WHERE "tournamentId" = ${tournamentId}
        `;
        await prisma.match.deleteMany({ where: { tournamentId } });
        await prisma.tournamentGroup.deleteMany({ where: { tournamentId } });

        // 5. Calcular distribución Snake Seeding en memoria
        const GROUPS_PER_BLOCK = 6;
        const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        type GroupDef = { letter: string; label: string; players: typeof registrations };
        const groupDefs: GroupDef[] = [];

        for (const block of blocks) {
            const sorted = [...block.players].sort((a, b) => b.registered_points - a.registered_points);
            const slots: typeof registrations[] = Array.from({ length: GROUPS_PER_BLOCK }, () => []);

            sorted.forEach((p, idx) => {
                const row = Math.floor(idx / GROUPS_PER_BLOCK);
                const col = row % 2 === 0
                    ? idx % GROUPS_PER_BLOCK
                    : GROUPS_PER_BLOCK - 1 - (idx % GROUPS_PER_BLOCK);
                slots[col].push(p);
            });

            slots.forEach(players => {
                groupDefs.push({
                    letter: LETTERS[groupDefs.length] ?? String(groupDefs.length + 1),
                    label: block.label,
                    players,
                });
            });
        }

        // 6. Crear todos los grupos en paralelo (solo metadatos, sin dependencias)
        const createdGroups = await Promise.all(
            groupDefs.map((def, i) =>
                prisma.tournamentGroup.create({
                    data: {
                        tournamentId,
                        name: `GRUPO ${def.letter} (${def.label})`,
                        order: i + 1,
                        tieBreakType: 'PGP'
                    },
                    select: { id: true }
                })
            )
        );

        // 7. Asignar jugadores con 1 sola query SQL masiva (CASE/WHEN)
        //    Evita los 54 UPDATEs individuales anteriores
        const assignments = groupDefs.flatMap((def, gi) =>
            def.players.map((p, pi) => ({ regId: p.id, groupId: createdGroups[gi].id, order: pi + 1 }))
        );

        if (assignments.length > 0) {
            const caseGroup  = assignments.map(a => `WHEN '${a.regId}' THEN '${a.groupId}'`).join(' ');
            const caseOrder  = assignments.map(a => `WHEN '${a.regId}' THEN ${a.order}`).join(' ');
            const inClause   = assignments.map(a => `'${a.regId}'`).join(', ');

            await prisma.$executeRawUnsafe(`
                UPDATE "TournamentRegistration"
                SET "groupId"    = CASE id ${caseGroup} END,
                    "groupOrder" = CASE id ${caseOrder} END
                WHERE id IN (${inClause})
            `);
        }

        // 8. Crear todos los partidos Round Robin con 1 solo INSERT masivo
        const matchData: Prisma.MatchCreateManyInput[] = [];

        groupDefs.forEach((def, gi) => {
            const groupId = createdGroups[gi].id;
            const [p1, p2, p3] = def.players;
            if (!p1 || !p2) return;

            if (p3) {
                matchData.push({ tournamentId, groupId, round: 1, matchOrder: 1,
                    homePlayerId: p1.player_id, awayPlayerId: p3.player_id,
                    homeTarget: 25, awayTarget: 25, matchDistance: 25 });
            }
            matchData.push({ tournamentId, groupId, round: 1, matchOrder: 2,
                homePlayerId: p1.player_id, awayPlayerId: p2.player_id,
                homeTarget: 25, awayTarget: 25, matchDistance: 25 });
            if (p3) {
                matchData.push({ tournamentId, groupId, round: 1, matchOrder: 3,
                    homePlayerId: p3.player_id, awayPlayerId: p2.player_id,
                    homeTarget: 25, awayTarget: 25, matchDistance: 25 });
            }
        });

        if (matchData.length > 0) {
            await prisma.match.createMany({ data: matchData });
        }

        revalidatePath(`/tournaments/${tournamentId}/grupos`);
        revalidatePath(`/tournaments/${tournamentId}/inscripciones`);

        return {
            success: true,
            numGroups: groupDefs.length,
            total,
            matchesCreated: matchData.length
        };

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
            r."registeredAverage"   AS registered_avg,
            r."preferredTurn"       AS pref_turn,
            p.id                    AS player_id,
            p."firstName"           AS first_name,
            p."lastName"            AS last_name,
            p."rut"                 AS rut,
            p."federationId"        AS federation_id,
            u."name"                AS user_name,
            c."name"                AS club_name,
            rk."average"            AS avg
        FROM "TournamentRegistration" r
        JOIN "Tournament" t ON t.id = r."tournamentId"
        JOIN "PlayerProfile" p ON p.id = r."playerId"
        LEFT JOIN "User" u ON u.id = p."userId"
        LEFT JOIN "Club" c ON c.id = p."tenantId"
        LEFT JOIN "Ranking" rk ON rk.id = (
            SELECT id FROM "Ranking" 
            WHERE "playerId" = p.id 
            AND discipline = t.discipline 
            LIMIT 1
        )
        WHERE r."tournamentId" = ${tournamentId}
          AND r.status IN ('APPROVED', 'PENDING')
        ORDER BY r."groupId" ASC, r."groupOrder" ASC, r."registeredPoints" DESC, r."registeredAt" ASC
    `;

    // Asegurar unicidad por reg_id (brute force fix para keys duplicadas)
    const uniqueRegsMap = new Map();
    for (const r of allRegs) {
        if (!uniqueRegsMap.has(r.reg_id)) {
            uniqueRegsMap.set(r.reg_id, r);
        }
    }
    const uniqueRegs = Array.from(uniqueRegsMap.values());

    // Normalizar y agrupar
    const normalize = (row: typeof uniqueRegs[0]) => ({
        id: row.reg_id,
        registeredPoints: row.registered_points,
        registeredAverage: row.registered_avg,
        preferredTurn: row.pref_turn,
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
        registrations: uniqueRegs
            .filter(r => r.group_id === g.id)
            .map(normalize)
    }));

    const unassigned = uniqueRegs
        .filter(r => r.group_id === null)
        .map(normalize);

    return { groups: groupsWithRegs, unassigned };
}

// ─────────────────────────────────────────────────────────
// SINCRONIZAR PARTIDOS SEGÚN DISTRIBUCIÓN MANUAL
// ─────────────────────────────────────────────────────────

export async function syncMatches(tournamentId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!["SUPERADMIN", "FEDERATION_ADMIN"].includes(role)) {
        return { success: false, error: "No autorizado" };
    }

    try {
        // 1. Obtener grupos y sus jugadores actuales (según groupOrder)
        const groups = await prisma.tournamentGroup.findMany({
            where: { tournamentId },
            include: {
                registrations: {
                    orderBy: { groupOrder: 'asc' },
                    select: { playerId: true }
                }
            },
            orderBy: { order: 'asc' }
        });

        if (groups.length === 0) return { success: false, error: "No hay grupos creados" };

        // 2. Borrar partidos actuales (Solo los de fase de grupos)
        // Buscamos matches que pertenezcan a un grupo del torneo
        await prisma.match.deleteMany({
            where: {
                tournamentId,
                groupId: { not: null }
            }
        });

        // 3. Crear nuevos partidos Round Robin
        const matchData: Prisma.MatchCreateManyInput[] = [];

        groups.forEach(group => {
            const players = group.registrations;
            const [p1, p2, p3] = players;
            if (!p1 || !p2) return;

            // Round Robin estándar Fechillar (3 jugadores)
            // Orden Oficial: 1 vs 3, 1 vs 2, 3 vs 2
            if (p3) {
                matchData.push({ 
                    tournamentId, groupId: group.id, round: 1, matchOrder: 1,
                    homePlayerId: p1.playerId, awayPlayerId: p3.playerId,
                    homeTarget: 25, awayTarget: 25, matchDistance: 25 
                });
            }

            matchData.push({ 
                tournamentId, groupId: group.id, round: 1, matchOrder: 2,
                homePlayerId: p1.playerId, awayPlayerId: p2.playerId,
                homeTarget: 25, awayTarget: 25, matchDistance: 25 
            });

            if (p3) {
                matchData.push({ 
                    tournamentId, groupId: group.id, round: 1, matchOrder: 3,
                    homePlayerId: p3.playerId, awayPlayerId: p2.playerId,
                    homeTarget: 25, awayTarget: 25, matchDistance: 25 
                });
            }
        });

        if (matchData.length > 0) {
            await prisma.match.createMany({ data: matchData });
        }

        revalidatePath(`/tournaments/${tournamentId}/grupos`);
        return { success: true, matchesCreated: matchData.length };
    } catch (error: any) {
        console.error("[syncMatches] Error:", error);
        return { success: false, error: error.message };
    }
}

