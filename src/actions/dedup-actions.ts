"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface DuplicateGroup {
    key: string;         // "APELLIDO NOMBRE" normalizado
    players: {
        id: string;
        displayName: string;
        rut: string | null;
        club: string;
        hasUser: boolean;
        createdAt: Date;
    }[];
}

/**
 * Detecta jugadores duplicados agrupados por nombre normalizado o RUT.
 * Un "duplicado" es cualquier grupo con 2+ perfiles con el mismo nombre completo o mismo RUT.
 */
export async function findDuplicatePlayers(): Promise<DuplicateGroup[]> {
    const session = await auth();
    if (!session) return [];

    const players = await prisma.playerProfile.findMany({
        where: { slug: { not: { startsWith: "del-" } } },
        include: {
            user: { select: { name: true } },
            club: { select: { name: true } }
        },
        orderBy: { createdAt: "asc" }
    });

    // Normalizar nombre: "Carlos  GUERRA  López" → "CARLOS GUERRA LOPEZ"
    const normalize = (p: any) => {
        const full = p.user?.name || `${p.firstName || ""} ${p.lastName || ""}`.trim();
        return full.toUpperCase().replace(/\s+/g, " ").trim();
    };

    // Agrupar por nombre normalizado
    const byName: Record<string, typeof players> = {};
    for (const p of players) {
        const key = normalize(p);
        if (!key || key === "") continue;
        if (!byName[key]) byName[key] = [];
        byName[key].push(p);
    }

    // Agrupar también por RUT (los que tienen RUT)
    const byRut: Record<string, typeof players> = {};
    for (const p of players) {
        if (!p.rut) continue;
        const rut = p.rut.replace(/\./g, "").replace(/-/g, "").toLowerCase().trim();
        if (!byRut[rut]) byRut[rut] = [];
        byRut[rut].push(p);
    }

    // Combinar grupos (sin duplicar ids entre grupos)
    const seenIds = new Set<string>();
    const groups: DuplicateGroup[] = [];

    const addGroup = (key: string, group: typeof players) => {
        if (group.length < 2) return;
        const newIds = group.map(p => p.id).filter(id => !seenIds.has(id));
        if (newIds.length < 2) return;
        newIds.forEach(id => seenIds.add(id));
        groups.push({
            key,
            players: group.filter(p => newIds.includes(p.id)).map(p => ({
                id: p.id,
                displayName: p.user?.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
                rut: p.rut,
                club: p.club?.name ?? "Sin club",
                hasUser: !!p.userId,
                createdAt: p.createdAt,
            }))
        });
    };

    for (const [key, group] of Object.entries(byName)) {
        addGroup(`Nombre: ${key}`, group);
    }
    for (const [rut, group] of Object.entries(byRut)) {
        addGroup(`RUT: ${rut}`, group);
    }

    return groups;
}

/**
 * Fusiona dos perfiles: conserva el "principal" (generalmente el que tiene cuenta de usuario)
 * y elimina el duplicado, reasignando sus partidas e inscripciones al principal.
 */
export async function mergePlayerProfiles(keepId: string, deleteId: string) {
    const session = await auth();
    const allowedRoles = ["SUPERADMIN", "FEDERATION_ADMIN"];
    if (!session?.user?.id || !allowedRoles.includes((session.user as any)?.role)) {
        return { success: false, error: "No autorizado" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Reasignar partidas del duplicado al perfil principal
            await tx.match.updateMany({ where: { homePlayerId: deleteId }, data: { homePlayerId: keepId } });
            await tx.match.updateMany({ where: { awayPlayerId: deleteId }, data: { awayPlayerId: keepId } });
            await tx.match.updateMany({ where: { winnerId: deleteId }, data: { winnerId: keepId } });

            // Reasignar inscripciones (ignorar conflictos si ya está inscrito)
            const inscripciones = await tx.tournamentRegistration.findMany({ where: { playerId: deleteId } });
            for (const ins of inscripciones) {
                const exists = await tx.tournamentRegistration.findUnique({
                    where: { tournamentId_playerId: { tournamentId: ins.tournamentId, playerId: keepId } }
                });
                if (!exists) {
                    await tx.tournamentRegistration.update({
                        where: { id: ins.id },
                        data: { playerId: keepId }
                    });
                } else {
                    await tx.tournamentRegistration.delete({ where: { id: ins.id } });
                }
            }

            // Reasignar rankings (ignorar conflictos)
            const rankings = await tx.ranking.findMany({ where: { playerId: deleteId } });
            for (const r of rankings) {
                const exists = await tx.ranking.findFirst({
                    where: { playerId: keepId, discipline: r.discipline }
                });
                if (!exists) {
                    await tx.ranking.update({ where: { id: r.id }, data: { playerId: keepId } });
                } else {
                    await tx.ranking.delete({ where: { id: r.id } });
                }
            }

            // Borrar snapshots del duplicado (los del principal se conservan)
            await tx.rankingSnapshot.deleteMany({ where: { playerId: deleteId } });

            // Auditoría
            await tx.auditLog.create({
                data: {
                    action: "PLAYER_MERGE",
                    userId: (session.user as any).id,
                    targetId: keepId,
                    details: `Perfil duplicado ${deleteId} fusionado en ${keepId}`
                }
            });

            // Eliminar el perfil duplicado (y su user si es shadow)
            const deleted = await tx.playerProfile.findUnique({
                where: { id: deleteId },
                select: { userId: true, user: { select: { email: true } } }
            });

            await tx.playerProfile.delete({ where: { id: deleteId } });

            // Eliminar el user solo si es sintético (shadow)
            if (deleted?.userId && deleted.user?.email?.endsWith("@fechillar.cl")) {
                await tx.user.delete({ where: { id: deleted.userId } }).catch(() => {});
            }
        });

        revalidatePath("/federacion/padron");
        revalidatePath("/clubs");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Elimina directamente un perfil duplicado sin fusión (si no tiene historial).
 */
export async function deletePlayerProfile(playerId: string) {
    const session = await auth();
    const allowedRoles = ["SUPERADMIN", "FEDERATION_ADMIN"];
    if (!session?.user?.id || !allowedRoles.includes((session.user as any)?.role)) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const player = await prisma.playerProfile.findUnique({
            where: { id: playerId },
            select: {
                userId: true,
                user: { select: { email: true } },
                matchHome: { take: 1, select: { id: true } },
                matchAway: { take: 1, select: { id: true } },
            }
        });

        if (!player) return { success: false, error: "Jugador no encontrado" };

        const hasHistory = player.matchHome.length > 0 || player.matchAway.length > 0;
        if (hasHistory) {
            return { success: false, error: "Tiene partidas registradas. Usa Fusionar en su lugar." };
        }

        await prisma.$transaction(async (tx) => {
            await tx.tournamentRegistration.deleteMany({ where: { playerId } });
            await tx.ranking.deleteMany({ where: { playerId } });
            await tx.rankingSnapshot.deleteMany({ where: { playerId } });
            await tx.playerProfile.delete({ where: { id: playerId } });

            if (player.userId && player.user?.email?.endsWith("@fechillar.cl")) {
                await tx.user.delete({ where: { id: player.userId } }).catch(() => {});
            }
        });

        revalidatePath("/federacion/padron");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
