"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Discipline, Category } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { CATEGORY_TARGETS } from "@/lib/billiards/constants";

/**
 * Mapea nombres de disciplinas de Chile a Enums de Prisma.
 */
function mapDiscipline(name: string): Discipline | null {
    const n = name.toLowerCase().trim();
    if (n.includes("3 band") || n.includes("tres band")) return Discipline.THREE_BAND;
    if (n.includes("bucha") || n.includes("pool")) return Discipline.BUCHACAS;
    if (n.includes("snooker")) return Discipline.SNOOKER;
    return null;
}

/**
 * Genera un ID inmutable basado en el nombre y el club de origen.
 * Este ID se usará como federationId si el jugador no tiene RUT.
 */
export async function generateLegacyFederationId(firstName: string, lastName: string, clubName: string) {
    const cleanName = `${firstName}-${lastName}`.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const cleanClub = clubName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    // Usamos un sufijo corto aleatorio para evitar colisiones exactas en nombres muy comunes, 
    // pero el nucleo es NOMBRE-CLUB.
    return `EXT-${cleanName}-${cleanClub}`.toUpperCase();
}

export async function processBulkImport(data: {
    players: {
        firstName: string;
        lastName: string;
        rut?: string;
        email?: string;
        clubName: string;
        disciplines: string[];
        points?: number;
        average?: number;
        category?: string;
        handicap?: number;
    }[],
    fixedClubId?: string
}) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "No autorizado" };

    const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[]
    };

    // 1. Asegurar existencia del club de la federación para libres
    await prisma.club.upsert({
        where: { slug: "sgf-federacion-libres" },
        update: {},
        create: {
            slug: "sgf-federacion-libres",
            name: "Federación Nacional - Jugadores Libres",
            isValidated: true,
            membershipStatus: "VIGENTE"
        }
    });

    // 2. Obtener todos los clubes para validar existencia
    const allClubs = await prisma.club.findMany({
        select: { id: true, name: true, slug: true }
    });

    for (const player of data.players) {
        try {
            const isFederationTerm = ["federacion", "federación", "libre", "sgf", "sin club"].includes(player.clubName.toLowerCase().trim());

            let club = data.fixedClubId 
                ? allClubs.find(c => c.id === data.fixedClubId)
                : allClubs.find(c => 
                    c.name.toLowerCase() === player.clubName.toLowerCase() || 
                    c.slug === player.clubName.toLowerCase()
                );

            // FALLBACK: Si no se encuentra el club o es un término federativo, asignamos al club virtual de la Federación
            if (!club || isFederationTerm) {
                club = allClubs.find(c => c.slug === "sgf-federacion-libres") || allClubs.find(c => c.slug.includes("federacion"));
            }

            if (!club) {
                results.skipped++;
                results.errors.push(`Club no encontrado ni existe fallback federativo: ${player.clubName}`);
                continue;
            }

            const fullName = `${player.firstName} ${player.lastName}`;
            const slug = fullName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + "-" + Math.random().toString(36).substring(2, 7);
            const federationId = player.rut ? null : await generateLegacyFederationId(player.firstName, player.lastName, club.name);

            // Verificar si ya existe (por RUT o por federationId), excluyendo perfiles fantasma (del-...)
            const existing = await prisma.playerProfile.findFirst({
                where: {
                    AND: [
                        { slug: { not: { startsWith: 'del-' } } },
                        {
                            OR: [
                                player.rut ? { rut: player.rut } : {},
                                federationId ? { federationId: federationId } : {}
                            ].filter(cond => Object.keys(cond).length > 0)
                        }
                    ]
                }
            });

            if (existing) {
                // ACTUALIZAR CLUB (TENANT) - Crucial para sacar a gente de la Federación al club real
                await prisma.playerProfile.update({
                    where: { id: existing.id },
                    data: { tenantId: club.id }
                });

                // ACTUALIZAR RANKINGS EXISTENTES
                // Función auxiliar para mapear Categoría
                const mapCategory = (c: string): Category => {
                    const clean = c.toUpperCase().trim();
                    if (clean === "MASTER") return Category.MASTER;
                    if (clean === "HONOR") return Category.HONOR;
                    if (clean === "FIRST") return Category.FIRST;
                    if (clean === "SECOND") return Category.SECOND;
                    if (clean === "THIRD") return Category.THIRD;
                    if (clean === "FOURTH") return Category.FOURTH;
                    if (clean === "FIFTH") return Category.FIFTH_A;
                    if (clean === "FIFTH_A" || clean === "FIFTH A") return Category.FIFTH_A;
                    if (clean === "FIFTH_B" || clean === "FIFTH B") return Category.FIFTH_B;
                    if (clean === "SENIOR") return Category.SENIOR;
                    if (clean === "FEMALE" || clean === "DAMAS") return Category.FEMALE;
                    return Category.PROMO;
                };

                for (const dName of player.disciplines) {
                    const mappedDisc = mapDiscipline(dName);
                    if (mappedDisc) {
                        const cat = mapCategory(player.category || "PROMO");
                        
                        // Borramos los PROMO con 0 puntos si existen y estamos actualizando a una categoria superior
                        if (cat !== "PROMO") {
                            await prisma.ranking.deleteMany({
                                where: { playerId: existing.id, discipline: mappedDisc, category: "PROMO", points: 0 }
                            });
                        }

                        // Buscamos si ya tiene un ranking para esta disciplina
                        const existingRanking = await prisma.ranking.findFirst({
                            where: { playerId: existing.id, discipline: mappedDisc }
                        });

                        if (existingRanking) {
                            await prisma.ranking.update({
                                where: { id: existingRanking.id },
                                data: {
                                    category: cat,
                                    points: player.points || 0,
                                    average: player.average || 0,
                                    handicapTarget: player.handicap || 
                                        (mappedDisc === Discipline.THREE_BAND ? CATEGORY_TARGETS[cat] : 15) || 
                                        15
                                }
                            });
                        } else {
                            await prisma.ranking.create({
                                data: {
                                    playerId: existing.id,
                                    discipline: mappedDisc,
                                    category: cat,
                                    points: player.points || 0,
                                    average: player.average || 0,
                                    handicapTarget: player.handicap || 
                                        (mappedDisc === Discipline.THREE_BAND ? CATEGORY_TARGETS[cat] : 15) || 
                                        15
                                }
                            });
                        }
                    }
                }
                
                (results as any).updated = ((results as any).updated || 0) + 1;
                continue;
            }

            // CREACIÓN - Sin User asociado inicialmente (Shadow Profile)
            await prisma.$transaction(async (tx) => {
                const profile = await tx.playerProfile.create({
                    data: {
                        firstName: player.firstName,
                        lastName: player.lastName,
                        email: player.email || null,
                        rut: player.rut || null,
                        federationId: federationId,
                        slug: slug,
                        tenantId: club.id,
                        averageBase: player.average || 0,
                    }
                });

                // Función auxiliar para mapear Categoría
                const mapCategory = (c: string): Category => {
                    const clean = c.toUpperCase().trim();
                    if (clean === "MASTER") return Category.MASTER;
                    if (clean === "HONOR") return Category.HONOR;
                    if (clean === "FIRST") return Category.FIRST;
                    if (clean === "SECOND") return Category.SECOND;
                    if (clean === "THIRD") return Category.THIRD;
                    if (clean === "FOURTH") return Category.FOURTH;
                    if (clean === "FIFTH") return Category.FIFTH_A;
                    if (clean === "FIFTH_A" || clean === "FIFTH A") return Category.FIFTH_A;
                    if (clean === "FIFTH_B" || clean === "FIFTH B") return Category.FIFTH_B;
                    if (clean === "SENIOR") return Category.SENIOR;
                    if (clean === "FEMALE" || clean === "DAMAS") return Category.FEMALE;
                    return Category.PROMO;
                };

                // Crear rankings (ahora con inteligencia del Excel)
                for (const dName of player.disciplines) {
                    const mappedDisc = mapDiscipline(dName);
                    if (mappedDisc) {
                        await tx.ranking.create({
                            data: {
                                playerId: profile.id,
                                discipline: mappedDisc,
                                category: mapCategory(player.category || "PROMO"),
                                points: player.points || 0,
                                average: player.average || 0,
                                handicapTarget: player.handicap || 
                                    (mappedDisc === Discipline.THREE_BAND ? CATEGORY_TARGETS[mapCategory(player.category || "PROMO")] : 15) || 
                                    15
                            }
                        });
                    }
                }
            });

            results.imported++;

        } catch (error: any) {
            results.errors.push(`Error con ${player.firstName} ${player.lastName}: ${error.message}`);
        }
    }

    if (results.imported > 0) {
        revalidatePath("/(sgf)/clubs", "page");
        if (data.fixedClubId) {
            revalidatePath(`/admin/clubes/${data.fixedClubId}`);
        }
    }

    return { success: true, ...results };
}

/**
 * Activa digitalmente un perfil de sombra vinculándole un correo y contraseña.
 */
export async function claimPlayerProfile(playerId: string, email: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "No autorizado" };

    try {
        const tempPassword = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        const result = await prisma.$transaction(async (tx) => {
            // 1. Verificar si el perfil existe y no tiene usuario
            const profile = await tx.playerProfile.findUnique({
                where: { id: playerId },
                include: { user: true }
            });

            if (!profile) throw new Error("Perfil no encontrado.");
            if (profile.userId) throw new Error("Este perfil ya tiene un usuario vinculado.");

            // 2. Crear el Usuario
            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase().trim(),
                    name: profile.slug.split('-').slice(0, 2).join(' ').toUpperCase(), // Heurística de nombre
                    role: "PLAYER",
                    // En un escenario real, aquí se hashearba la tempPassword
                    passwordHash: tempPassword 
                }
            });

            // 3. Vincular al Perfil
            await tx.playerProfile.update({
                where: { id: playerId },
                data: { userId: user.id }
            });

            return { email, tempPassword };
        });

        // MOCK: Envío de correo (Aquí se integraría Resend/SendGrid)
        console.log(`[EMAIL MOCK] Enviado a ${result.email}. Clave provisoria: ${result.tempPassword}`);

        return { 
            success: true, 
            message: `Perfil activado. Se ha generado la clave provisoria: ${result.tempPassword}` 
        };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Activa masivamente todos los perfiles provisionales (Shadow Profiles) del sistema.
 * Crea un registro User para cada PlayerProfile sin userId, sin importar el club.
 * Usa el email del perfil si existe; de lo contrario genera uno sintético basado en el slug.
 *
 * @returns Resumen con totales de activados, omitidos y errores.
 */
export async function bulkActivateAllPlayers() {
    const session = await auth();
    const allowedRoles = ["SUPERADMIN", "FEDERATION_ADMIN"];
    if (!session?.user?.id || !allowedRoles.includes((session?.user as any)?.role)) {
        return { success: false, error: "No autorizado. Se requiere rol SUPERADMIN o FEDERATION_ADMIN." };
    }

    const TEMP_PASSWORD = "FECHILLAR2025";

    // Obtener todos los perfiles sin usuario vinculado
    const shadowProfiles = await prisma.playerProfile.findMany({
        where: { userId: null },
        select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
            email: true,
        }
    });

    if (shadowProfiles.length === 0) {
        return { success: true, activated: 0, skipped: 0, errors: [], message: "Todos los jugadores ya están activados." };
    }

    const results = {
        activated: 0,
        skipped: 0,
        errors: [] as string[],
    };

    for (const profile of shadowProfiles) {
        try {
            // Determinar email: usar el registrado o generar uno sintético único por slug
            const email = profile.email?.trim()
                ? profile.email.trim().toLowerCase()
                : `${profile.slug}@fechillar.cl`;

            // Determinar nombre visible
            const name = (profile.firstName && profile.lastName)
                ? `${profile.firstName} ${profile.lastName}`.toUpperCase()
                : profile.slug.split('-').slice(0, 2).join(' ').toUpperCase();

            await prisma.$transaction(async (tx) => {
                // Verificar que el email no esté en uso por otro User
                const existingUser = await tx.user.findUnique({ where: { email } });
                if (existingUser) {
                    // Si el usuario ya existe pero el perfil no está vinculado, vincular directamente
                    await tx.playerProfile.update({
                        where: { id: profile.id },
                        data: { userId: existingUser.id }
                    });
                } else {
                    // Crear nuevo User y vincular
                    const user = await tx.user.create({
                        data: {
                            email,
                            name,
                            role: "PLAYER",
                            passwordHash: TEMP_PASSWORD,
                        }
                    });
                    await tx.playerProfile.update({
                        where: { id: profile.id },
                        data: { userId: user.id }
                    });
                }
            });

            results.activated++;
        } catch (error: any) {
            results.skipped++;
            results.errors.push(`[${profile.firstName || profile.slug}]: ${error.message}`);
        }
    }

    revalidatePath("/federacion/padron");
    revalidatePath("/admin/dashboard");

    return {
        success: true,
        ...results,
        message: `Activación masiva completada. ${results.activated} jugadores activados, ${results.skipped} omitidos.`
    };
}
