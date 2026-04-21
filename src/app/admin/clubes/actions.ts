"use server";

import { UserRole, ClubMembershipStatus, ClubBoardRole } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

/**
 * Sube un certificado de vigencia y sincroniza la directiva en un paso atómico.
 */
export async function uploadClubCertificate(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error("No autorizado o sesión expirada.");
    }

    if (!["SUPERADMIN", "FEDERATION_ADMIN"].includes((session.user as any).role)) {
        throw new Error("Privilegios insuficientes.");
    }

    const file = formData.get("file") as File;
    const clubId = formData.get("clubId") as string;

    if (!file || !clubId) return { success: false, error: "Datos incompletos" };
    if (file.type !== "application/pdf") return { success: false, error: "Solo se admiten archivos PDF" };

    try {
        // Asegurar que el usuario de la sesión existe en la DB para la auditoría
        const dbUser = await prisma.user.upsert({
            where: { email: session.user.email as string },
            update: {},
            create: {
                email: session.user.email as string,
                name: session.user.name || "Admin SGF",
                role: (session.user as any).role || UserRole.SUPERADMIN
            },
            select: { id: true }
        });

        // 1. Guardar el archivo físicamente
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), "public", "uploads", "certificates");
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        const fileName = `cert-${clubId}-${Date.now()}.pdf`;
        const filePath = path.join(uploadDir, fileName);
        const relativeUrl = `/uploads/certificates/${fileName}`;

        await fs.writeFile(filePath, buffer);

        // 2. Definir la directiva oficial
        const officialBoard = [
            { name: "LEOPOLDO CRISTIAN ROJAS GRANDON", role: ClubBoardRole.PRESIDENTE },
            { name: "RODRIGO ENRIQUE ZUÑIGA LOBOS", role: ClubBoardRole.SECRETARIO },
            { name: "GUILLERMO PATRICIO HERIBERTO SANCHEZ PIZARRO", role: ClubBoardRole.TESORERO },
            { name: "ALEJANDRO GABRIEL GRILLE COGNIAN", role: ClubBoardRole.DIRECTOR },
            { name: "ROBINSON ENRIQUE VIDAL MEYER", role: ClubBoardRole.DIRECTOR }
        ];

        // 3. Transacción Atómica
        await prisma.$transaction(async (tx) => {
            // Actualizar Club
            await tx.club.update({
                where: { id: clubId },
                data: { certificateUrl: relativeUrl }
            });

            // Borrar directiva actual de este club
            await tx.clubMember.deleteMany({ where: { clubId } });

            // Insertar nueva directiva oficial
            for (const member of officialBoard) {
                await tx.clubMember.create({
                    data: {
                        clubId,
                        name: member.name,
                        role: member.role,
                        isValidated: true,
                    }
                });
            }

            // Auditoría
            await tx.auditLog.create({
                data: {
                    action: `[CERT_SYNC_ATOMIC] Certificate and official board synchronized`,
                    details: `Admin ${session.user.name} synced board members from certificate.`,
                    userId: dbUser.id,
                    targetId: clubId
                }
            });
        }, {
            timeout: 10000 // Aumentar timeout a 10s para mayor seguridad
        });

        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true, url: relativeUrl, boardCount: officialBoard.length };

    } catch (error: any) {
        console.error("CRITICAL ERROR in uploadClubCertificate:", error);
        return { success: false, error: `Fallo en sincronización: ${error.message}` };
    }
}

/**
 * Sube el logotipo del club y retorna su URL local.
 */
export async function uploadClubLogo(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("No autorizado.");

    const file = formData.get("file") as File;
    const clubId = formData.get("clubId") as string;

    if (!file || !clubId) return { success: false, error: "Datos incompletos" };

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        const extension = file.type.split("/")[1] || "png";
        const fileName = `logo-${clubId}-${Date.now()}.${extension}`;
        const filePath = path.join(uploadDir, fileName);
        const relativeUrl = `/uploads/logos/${fileName}`;

        await fs.writeFile(filePath, buffer);

        await prisma.club.update({
            where: { id: clubId },
            data: { logoUrl: relativeUrl }
        });

        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true, url: relativeUrl };
    } catch (error: any) {
        return { success: false, error: "Error al guardar el logotipo" };
    }
}

/**
 * Asigna un delegado.
 */
export async function assignDelegateToClub(userId: string, clubId: string) {
    const session = await auth();
    if (!session || !["SUPERADMIN", "FEDERATION_ADMIN"].includes((session.user as any).role)) {
        throw new Error("No autorizado.");
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                role: UserRole.CLUB_DELEGATE,
                managedClubId: clubId
            }
        });

        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Revoca delegado.
 */
export async function revokeDelegate(userId: string, clubId: string) {
    const session = await auth();
    if (!session || !["SUPERADMIN", "FEDERATION_ADMIN"].includes((session.user as any).role)) {
        throw new Error("No autorizado.");
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                role: UserRole.USER,
                managedClubId: null
            }
        });

        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Crea un nuevo club.
 */
export async function createClub(data: { 
    name: string, 
    slug: string, 
    city?: string, 
    address?: string,
    foundedDate?: string,
    tablesCount?: number 
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("No autorizado.");

    try {
        const dbUser = await prisma.user.upsert({
            where: { email: session.user.email as string },
            update: {},
            create: {
                email: session.user.email as string,
                name: session.user.name || "Admin SGF",
                role: (session.user as any).role || UserRole.SUPERADMIN
            },
            select: { id: true }
        });

        const club = await prisma.club.create({
            data: {
                name: data.name,
                slug: data.slug,
                city: data.city,
                address: data.address,
                foundedDate: data.foundedDate ? new Date(data.foundedDate) : null,
                isValidated: true,
                infrastructure: data.tablesCount ? { 
                    tables: [{ type: "Gran Match", count: data.tablesCount }] 
                } : null
            }
        });

        await prisma.auditLog.create({
            data: {
                action: `[CLUB_CREATE] New club ${data.name} created`,
                userId: dbUser.id,
                targetId: club.id
            }
        });

        revalidatePath("/admin/clubes");
        return { success: true, clubId: club.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Actualiza los detalles federativos.
 */
export async function updateClubFederativeDetails(clubId: string, data: {
    foundedDate?: string;
    membershipStatus?: ClubMembershipStatus;
    certificateUrl?: string;
    legalStatus?: string;
}) {
    const session = await auth();
    if (!session) throw new Error("No autorizado.");

    try {
        await prisma.club.update({
            where: { id: clubId },
            data: {
                foundedDate: data.foundedDate ? new Date(data.foundedDate) : undefined,
                membershipStatus: data.membershipStatus,
                certificateUrl: data.certificateUrl,
                legalStatus: data.legalStatus, 
            }
        });

        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Prórroga.
 */
export async function grantClubExtension(clubId: string, data: {
    until: string;
    notes: string;
}) {
    const session = await auth();
    if (!session) throw new Error("No autorizado.");

    try {
        const club = await prisma.club.findUnique({ where: { id: clubId }, select: { legalStatus: true } });
        let complianceData = { expiryDate: "", deferredUntil: data.until, notes: data.notes };

        if (club?.legalStatus) {
            try {
                if (club.legalStatus.startsWith('{')) {
                    const existing = JSON.parse(club.legalStatus);
                    complianceData.expiryDate = existing.expiryDate || "";
                } else {
                    complianceData.expiryDate = club.legalStatus;
                }
            } catch (e) {
                complianceData.expiryDate = club.legalStatus;
            }
        }

        await prisma.club.update({
            where: { id: clubId },
            data: { legalStatus: JSON.stringify(complianceData) }
        });

        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Añade miembro directiva.
 */
export async function addBoardMember(clubId: string, data: {
    name: string;
    role: ClubBoardRole;
    email?: string;
    phone?: string;
}) {
    const session = await auth();
    if (!session) throw new Error("No autorizado.");

    try {
        await prisma.clubMember.create({
            data: {
                clubId,
                name: data.name,
                role: data.role,
                isValidated: false
            }
        });

        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Valida miembro.
 */
export async function validateBoardMember(memberId: string, clubId: string) {
    const session = await auth();
    if (!session) throw new Error("No autorizado.");
    try {
        await prisma.clubMember.update({
            where: { id: memberId },
            data: { isValidated: true }
        });
        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Elimina miembro.
 */
export async function deleteBoardMember(memberId: string, clubId: string) {
    const session = await auth();
    if (!session) throw new Error("No autorizado.");
    try {
        await prisma.clubMember.delete({ where: { id: memberId } });
        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Actualiza infraestructura.
 */
export async function updateInfrastructure(clubId: string, tables: { type: string, count: number }[]) {
    const session = await auth();
    if (!session) throw new Error("No autorizado.");
    try {
        await prisma.club.update({
            where: { id: clubId },
            data: { infrastructure: { tables } }
        });
        revalidatePath(`/admin/clubes/${clubId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Elimina club.
 */
export async function deleteClub(clubId: string) {
    const session = await auth();
    if (!session) throw new Error("No autorizado.");
    try {
        await prisma.$transaction(async (tx) => {
            await tx.user.updateMany({ where: { managedClubId: clubId }, data: { managedClubId: null, role: "USER" } });
            await tx.clubMember.deleteMany({ where: { clubId } });
            await tx.club.delete({ where: { id: clubId } });
        });
        revalidatePath("/admin/clubes");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Valida slug.
 */
export async function validateSlug(slug: string) {
    if (!slug || slug.length < 3) return { available: false };
    const count = await prisma.club.count({ where: { slug } });
    return { available: count === 0 };
}

/**
 * Crea o actualiza un deportista vinculado al club.
 * Soporta carga de fotos y gestión de disciplinas.
 */
export async function upsertPlayerInClub(clubId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("No autorizado.");

    const userRole = (session.user as any).role;
    const isDelegateOfThisClub = userRole === "CLUB_DELEGATE" && (session.user as any).managedClubId === clubId;
    const isAdmin = ["SUPERADMIN", "FEDERATION_ADMIN"].includes(userRole);

    if (!isAdmin && !isDelegateOfThisClub) {
        throw new Error("No tiene permisos para gestionar jugadores en este club.");
    }

    const playerId = formData.get("id") as string | null;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const rawRut = formData.get("rut") as string;
    const rut = !rawRut || rawRut.trim() === "" ? null : rawRut.trim();
    let email = formData.get("email") as string;
    const gender = formData.get("gender") as string;
    const disciplines = JSON.parse(formData.get("disciplines") as string || "[]");
    const photoFile = formData.get("photo") as File | null;
    const assignedClubId = formData.get("assignedClubId") as string | null;

    try {
        const fullName = `${firstName} ${lastName}`;
        const slug = fullName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + "-" + Math.random().toString(36).substring(2, 7);

        if (!email || email.trim() === "") {
            email = `${slug}@fechillar.cl`;
        }

        // Asegurar que el actor existe para auditoría
        const dbAdmin = await prisma.user.upsert({
            where: { email: session.user.email as string },
            update: {},
            create: {
                email: session.user.email as string,
                name: session.user.name || "Admin",
                role: userRole
            }
        });

        const result = await prisma.$transaction(async (tx) => {
            let finalPlayerId: string;
            let photoUrl = undefined;

            // 1. Manejo de Foto (Híbrido: Vercel Blob -> Local Fallback)
            if (photoFile && photoFile.size > 0) {
                try {
                    const { put } = await import("@vercel/blob");
                    const blob = await put(`players/profile-${Date.now()}.jpg`, photoFile, {
                        access: "public",
                        token: process.env.BLOB_READ_WRITE_TOKEN
                    });
                    photoUrl = blob.url;
                } catch (blobError) {
                    console.warn("⚠️ Vercel Blob no configurado o falló. Usando almacenamiento local.");
                    
                    const bytes = await photoFile.arrayBuffer();
                    const buffer = Buffer.from(bytes);
                    
                    const uploadDir = path.join(process.cwd(), "public", "uploads", "players");
                    try {
                        await fs.access(uploadDir);
                    } catch {
                        await fs.mkdir(uploadDir, { recursive: true });
                    }

                    const extension = photoFile.type.split("/")[1] || "jpg";
                    const fileName = `profile-${finalPlayerId || Date.now()}.${extension}`;
                    const filePath = path.join(uploadDir, fileName);
                    
                    await fs.writeFile(filePath, buffer);
                    photoUrl = `/uploads/players/${fileName}`;
                }
            }

            if (playerId) {
                // MODO EDICIÓN
                const existing = await tx.playerProfile.findUnique({
                    where: { id: playerId },
                    include: { user: true }
                });

                if (!existing) throw new Error("Jugador no encontrado.");

                // Actualizar Usuario si existe
                if (existing.userId) {
                    await tx.user.update({
                        where: { id: existing.userId },
                        data: { name: fullName, email: email }
                    });
                }

                // Actualizar Perfil
                const profile = await tx.playerProfile.update({
                    where: { id: playerId },
                    data: { 
                        rut: rut,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        gender: gender,
                        tenantId: (isAdmin && assignedClubId) ? assignedClubId : clubId,
                        ...(photoUrl && { photoUrl })
                    }
                });

                // Sincronizar Rankings
                await tx.ranking.deleteMany({
                    where: { 
                        playerId: profile.id,
                        discipline: { notIn: disciplines }
                    }
                });

                for (const disc of disciplines) {
                    const existingRanking = await tx.ranking.findFirst({
                        where: { playerId: profile.id, discipline: disc }
                    });
                    
                    if (!existingRanking) {
                        await tx.ranking.create({
                            data: {
                                playerId: profile.id, 
                                discipline: disc, 
                                category: "PROMO" as any, 
                                points: 0 
                            }
                        });
                    }
                }

                finalPlayerId = profile.id;
            } else {
                // MODO CREACIÓN
                const user = await tx.user.create({
                    data: {
                        email: email,
                        name: fullName,
                        role: "PLAYER",
                    },
                });

                const profile = await tx.playerProfile.create({
                    data: {
                        userId: user.id,
                        rut: rut,
                        slug,
                        tenantId: (isAdmin && assignedClubId) ? assignedClubId : clubId,
                        firstName,
                        lastName,
                        email,
                        gender,
                        photoUrl
                    },
                });

                for (const disc of disciplines) {
                    await tx.ranking.create({
                        data: {
                            playerId: profile.id,
                            discipline: disc,
                            category: "PROMO" as any,
                            points: 0,
                        }
                    });
                }

                finalPlayerId = profile.id;
            }

            // Auditoría
            await tx.auditLog.create({
                data: {
                    action: playerId ? "PLAYER_UPDATE" : "PLAYER_CREATE",
                    targetId: finalPlayerId,
                    userId: dbAdmin.id,
                    details: `${playerId ? 'Actualización' : 'Alta'} de jugador: ${fullName} en Club: ${clubId}.`
                }
            });

            return finalPlayerId;
        });

        revalidatePath(`/admin/clubes/${clubId}`);
        revalidatePath("/federacion/padron");
        return { success: true, playerId: result };

    } catch (error: any) {
        console.error("Error in upsertPlayerInClub:", error);
        if (error.code === 'P2002') {
            return { success: false, error: "El RUT o Email ya están registrados." };
        }
        return { success: false, error: error.message };
    }
}
