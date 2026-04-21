"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Actualiza la fotografía oficial de un jugador.
 * Sube la imagen a Vercel Blob y vincula la URL al perfil.
 */
export async function updatePlayerPhoto(playerId: string, formData: FormData) {
    const session = await auth();
    if (!session || !["SUPERADMIN", "FEDERATION_ADMIN", "ADMIN"].includes((session.user as any).role)) {
        throw new Error("No autorizado");
    }

    const file = formData.get("photo") as File;
    if (!file || file.size === 0) {
        throw new Error("No se ha proporcionado ninguna imagen válida.");
    }

    try {
        // 1. Subida a Vercel Blob
        const blob = await put(`players/profile-${playerId}-${Date.now()}.jpg`, file, {
            access: "public",
        });

        // 2. Actualización en Base de Datos
        const player = await prisma.playerProfile.update({
            where: { id: playerId },
            data: { photoUrl: blob.url },
            include: { user: true }
        });

        // 3. Auditoría
        await prisma.auditLog.create({
            data: {
                action: "PLAYER_PHOTO_UPDATE",
                userId: (session.user as any).id,
                targetId: playerId,
                details: `Actualización de retrato oficial para ${player.user?.name || "ID: " + playerId}`
            }
        });

        revalidatePath(`/players/${playerId}`);
        revalidatePath("/federacion/padron");
        // Revalidar el carnet público si tiene slug
        if (player.slug) revalidatePath(`/perfil/${player.slug}`);
        if (player.publicSlug) revalidatePath(`/perfil/${player.publicSlug}`);
        
        return { success: true, url: blob.url };
    } catch (error: any) {
        console.error("Error updating player photo:", error);
        throw new Error("Error técnico al actualizar la fotografía.");
    }
}

/**
 * Actualiza los datos maestros de un jugador (RUT, Club, Categoría, Email).
 * Soporta aislamiento Multi-tenant para delegados de club.
 */
export async function updatePlayer(playerId: string, formData: FormData) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");
    
    const userRole = (session.user as any).role;
    const isSuper = ["SUPERADMIN", "FEDERATION_ADMIN"].includes(userRole);
    const managedClubId = (session.user as any).managedClubId;

    const name = (formData.get("name") as string)?.trim() || "";
    const email = (formData.get("email") as string)?.trim() || "";
    // FIX 1: rut vacío → null para evitar colisiones de unique constraint
    const rawRut = formData.get("rut") as string;
    const rut = (!rawRut || rawRut.trim() === "") ? null : rawRut.trim();
    const clubId = formData.get("clubId") as string;
    const gender = formData.get("gender") as string;
    const photoFile = formData.get("photo") as File;

    // Verificar permiso sobre el jugador específico
    const existingPlayer = await prisma.playerProfile.findUnique({
        where: { id: playerId },
        select: { tenantId: true, userId: true, email: true }
    });

    if (!existingPlayer) return { success: false, error: "Jugador no encontrado" };

    // Lógica de Aislamiento
    if (!isSuper && existingPlayer.tenantId !== managedClubId) {
        return { success: false, error: "No tienes permiso para editar jugadores de otros clubes." };
    }

    try {
        let photoUrl = undefined;
        if (photoFile && photoFile.size > 0) {
            const blob = await put(`players/profile-${playerId}-${Date.now()}.jpg`, photoFile, {
                access: "public",
            });
            photoUrl = blob.url;
        }

        const updated = await prisma.$transaction(async (tx) => {
            // FIX 2: Actualizar usuario solo si el email realmente cambió y no es sintético
            if (existingPlayer.userId) {
                const userUpdateData: any = { name };
                // Solo actualizar el email si cambió y es un email real (no sintético generado)
                if (email && email !== existingPlayer.email && !email.endsWith("@fechillar.cl")) {
                    // Verificar que el nuevo email no esté en uso por otro usuario
                    const emailInUse = await tx.user.findUnique({ where: { email }, select: { id: true } });
                    if (!emailInUse || emailInUse.id === existingPlayer.userId) {
                        userUpdateData.email = email;
                    }
                }
                await tx.user.update({
                    where: { id: existingPlayer.userId },
                    data: userUpdateData,
                });
            }

            // Actualizar Perfil
            const names = name?.split(" ") || ["", ""];
            return await tx.playerProfile.update({
                where: { id: playerId },
                data: {
                    rut,
                    firstName: names[0],
                    lastName: names.slice(1).join(" "),
                    email: email || undefined,
                    tenantId: clubId || undefined,
                    gender: gender || undefined,
                    ...(photoUrl && { photoUrl })
                }
            });
        });

        revalidatePath("/federacion/padron");
        revalidatePath(`/players/${playerId}`);
        if (updated.publicSlug) revalidatePath(`/perfil/${updated.publicSlug}`);
        
        // FIX 3: retornar success en lugar de lanzar, para que el cliente vea el error real
        return { success: true, player: updated };
    } catch (error: any) {
        console.error("Error updating player:", error);
        // Mensajes Prisma amigables
        if (error.code === "P2002") {
            const field = error.meta?.target?.[0] ?? "campo";
            return { success: false, error: `El ${field === "rut" ? "RUT" : field === "email" ? "Email" : field} ya está registrado para otro jugador.` };
        }
        return { success: false, error: error.message ?? "Fallo al actualizar el expediente." };
    }
}

/**
 * Elimina un perfil de jugador y su cuenta de usuario asociada.
 * Solo permitido para SuperAdmins o Delegados de su propio club.
 */
export async function deletePlayer(playerId: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    const userRole = (session.user as any).role;
    const isSuper = ["SUPERADMIN", "FEDERATION_ADMIN"].includes(userRole);
    const managedClubId = (session.user as any).managedClubId;

    const player = await prisma.playerProfile.findUnique({
        where: { id: playerId },
        select: { tenantId: true, userId: true, firstName: true, lastName: true, user: { select: { name: true } } }
    });

    if (!player) throw new Error("Jugador no encontrado");

    if (!isSuper && player.tenantId !== managedClubId) {
        throw new Error("No tienes autorización para eliminar jugadores fuera de tu jurisdicción.");
    }

    try {
        // Liberar identificadores críticos preventivamente por si el borrado falla
        // debido a restricciones de base de datos (partidos, validaciones, etc)
        const ts = Date.now();
        await prisma.playerProfile.update({
            where: { id: playerId },
            data: { 
                rut: `del-${ts}`,
                email: `del-${ts}@fechillar.cl`,
                slug: `del-${ts}-${Math.random().toString(36).substring(2,6)}`
            }
        });
        
        if (player.userId) {
            await prisma.user.update({
                where: { id: player.userId },
                data: { email: `del-${ts}@fechillar.cl` }
            });
        }
    } catch (e) {
        console.warn("No se pudo pre-limpiar los datos del jugador:", e);
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Auditoría antes de borrar
            await tx.auditLog.create({
                data: {
                    action: "PLAYER_DELETE",
                    userId: (session.user as any).id,
                    targetId: playerId,
                    details: `Eliminación total del perfil de ${player.user?.name || player.firstName + ' ' + player.lastName}`
                }
            });

            // Limpiar dependencias directas del PlayerProfile
            await tx.match.updateMany({ where: { homePlayerId: playerId }, data: { homePlayerId: null } });
            await tx.match.updateMany({ where: { awayPlayerId: playerId }, data: { awayPlayerId: null } });
            await tx.match.updateMany({ where: { winnerId: playerId }, data: { winnerId: null } });
            await tx.transferRequest.deleteMany({ where: { playerId: playerId } });

            // Borrar explícitamente el perfil primero para evitar problemas si falta el Cascade
            await tx.playerProfile.delete({
                where: { id: playerId }
            });

            if (player.userId) {
                // Limpiar dependencias directas del User
                await tx.clubMember.updateMany({ where: { userId: player.userId }, data: { userId: null } });
                await tx.tournament.updateMany({ where: { createdById: player.userId }, data: { createdById: null } });
                await tx.tournamentRegistration.updateMany({ where: { validatorId: player.userId }, data: { validatorId: null } });
                await tx.match.updateMany({ where: { refereeId: player.userId }, data: { refereeId: null } });
                await tx.tournamentEnrollment.updateMany({ where: { validatorId: player.userId }, data: { validatorId: null } });
                await tx.membership.updateMany({ where: { validatedById: player.userId }, data: { validatedById: null } });

                await tx.user.delete({
                    where: { id: player.userId }
                });
            }
        });

        revalidatePath("/federacion/padron");
        return { success: true };
    } catch (error) {
        console.error("Error deleting player:", error);
        throw new Error("Error al procesar la baja del jugador.");
    }
}

/**
 * Busca jugadores por nombre, RUT o ID federativo para el selector de inscripciones.
 * Incluye Shadow Profiles (jugadores sin cuenta de usuario vinculada).
 */
export async function searchPlayers(query: string) {
    if (!query || query.length < 2) return [];

    const players = await prisma.playerProfile.findMany({
        where: {
            AND: [
                { slug: { not: { startsWith: "del-" } } },
                {
                    OR: [
                        { user: { name: { contains: query, mode: "insensitive" } } },
                        { firstName: { contains: query, mode: "insensitive" } },
                        { lastName: { contains: query, mode: "insensitive" } },
                        { rut: { contains: query, mode: "insensitive" } },
                        { federationId: { contains: query, mode: "insensitive" } },
                        { email: { contains: query, mode: "insensitive" } },
                    ]
                }
            ]
        },
        include: {
            user: { select: { name: true } },
            club: { select: { name: true } }
        },
        take: 15,
        orderBy: { firstName: "asc" }
    });

    return players.map(p => ({
        id: p.id,
        name: p.user?.name || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Sin nombre",
        rut: p.rut ?? null,
        club: p.club?.name ?? "Jugador Libre",
    }));
}

/**
 * Obtiene todos los jugadores activos de un club específico.
 */
export async function getPlayersByClub(clubId: string) {
    const players = await prisma.playerProfile.findMany({
        where: {
            tenantId: clubId,
            slug: { not: { startsWith: "del-" } }
        },
        include: {
            user: { select: { name: true } }
        },
        orderBy: { firstName: "asc" }
    });

    return players.map(p => ({
        id: p.id,
        name: p.user?.name || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Sin nombre",
        rut: p.rut ?? null,
    }));
}
