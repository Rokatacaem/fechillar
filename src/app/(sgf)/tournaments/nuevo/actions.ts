"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAllClubs() {
    return await prisma.club.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    });
}

export async function getPrizeTemplates() {
    return await prisma.prizeTemplate.findMany({
        orderBy: { name: "asc" }
    });
}

export async function createTournament(prevState: any, formData: FormData) {
    const session = await auth();
    
    if (!session?.user?.id) {
        throw new Error("No autorizado");
    }

    const role = (session?.user as any)?.role;
    const tenantId = (session?.user as any)?.tenantId;
    const userId = (session?.user as any)?.id; 

    if (!userId) {
        return { 
            success: false, 
            error: "Sesión inválida: No se encontró tu ID de usuario. Por favor, re-inicia sesión.",
            fields: Object.fromEntries(formData.entries())
        };
    }

    // Sincronización de sesión "Sobre la Marcha" (Self-Healing)
    let finalUserId = userId;
    try {
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!dbUser && (role === "SUPERADMIN" || (session?.user as any)?.email === "admin@fechillar.cl")) {
            const admin = await prisma.user.upsert({
                where: { email: (session?.user as any)?.email },
                update: { role: "SUPERADMIN" },
                create: {
                    id: userId,
                    email: (session?.user as any)?.email,
                    name: (session?.user as any)?.name || "Admin Auto-Provisioned",
                    role: "SUPERADMIN",
                    passwordHash: "admin123"
                }
            });
            finalUserId = admin.id;
        }
    } catch (e) {
        console.error("Session healing failed:", e);
    }

    // Datos Numéricos (Sanitización estricta)
    const capacity = parseInt(formData.get("capacity") as string) || 32;
    const waitingListLimit = parseInt(formData.get("waitingListLimit") as string) || 0;
    const qualifiedPerGroup = parseInt(formData.get("qualifiedPerGroup") as string) || 2;
    const inningsPerPhase = parseInt(formData.get("inningsPerPhase") as string) || 30;

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const discipline = formData.get("discipline") as string;
    const tournamentType = formData.get("type") as string; // Con/Sin handicap
    const category = formData.get("category") as any;
    const status = formData.get("status") as any;
    const startDateRaw = formData.get("startDate") as string;
    const endDateRaw = formData.get("endDate") as string;
    const scope = formData.get("scope") as any;
    
    // Sede
    const venueClubId = formData.get("venueClubId") as string;
    const venueAddress = formData.get("venueAddress") as string;

    // Campos de Documentos
    // const registrationFee = parseInt(formData.get("registrationFee") as string) || 30000;
    const bankAccountName = formData.get("bankAccountName") as string;
    const bankAccountRut = formData.get("bankAccountRut") as string;
    const bankName = formData.get("bankName") as string;
    const bankAccountType = formData.get("bankAccountType") as string;
    const bankAccountNumber = formData.get("bankAccountNumber") as string;
    const bankAccountEmail = formData.get("bankAccountEmail") as string;
    
    const distanceGroups = parseInt(formData.get("distanceGroups") as string) || 25;
    const distancePlayoffs = parseInt(formData.get("distancePlayoffs") as string) || 25;
    const distanceFinal = parseInt(formData.get("distanceFinal") as string) || 30;
    const finalUnlimitedInnings = formData.get("finalUnlimitedInnings") === "on";
    
    const scheduleDay1Start = formData.get("scheduleDay1Start") as string;
    const scheduleDay2Start = formData.get("scheduleDay2Start") as string;
    
    const registrationContact = formData.get("registrationContact") as string;
    const registrationPhone = formData.get("registrationPhone") as string;
    
    const prizeDistributionRaw = formData.get("prizeDistribution") as string;
    let prizeDistribution = undefined;
    try {
        prizeDistribution = prizeDistributionRaw ? JSON.parse(prizeDistributionRaw) : undefined;
    } catch (e) {
        console.error("Failed to parse prize distribution:", e);
    }

    const registrationDeadlineRaw = formData.get("registrationDeadline") as string;
    const groupsPublishDateRaw = formData.get("groupsPublishDate") as string;
    const registrationDeadline = registrationDeadlineRaw ? new Date(registrationDeadlineRaw) : null;
    const groupsPublishDate = groupsPublishDateRaw ? new Date(groupsPublishDateRaw) : null;

    // Configuración dinámica base
    const configRaw = formData.get("config") as string;
    let baseConfig = {};
    try {
        baseConfig = configRaw ? JSON.parse(configRaw) : {};
    } catch (e) {
        console.error("Failed to parse tournament config:", e);
    }

    // Validaciones de Control de Acceso (RBAC)
    if (scope === "NATIONAL") {
        if (role !== "FEDERATION_DELEGATE" && role !== "FEDERATION_ADMIN" && role !== "SUPERADMIN") {
            throw new Error("Permisos insuficientes para crear un Torneo Nacional");
        }
    }

    if (scope === "INTERNAL") {
        if (role !== "CLUB_DELEGATE" && role !== "CLUB_ADMIN" && role !== "FEDERATION_ADMIN" && role !== "SUPERADMIN") {
            throw new Error("Permisos insuficientes para gestionar torneos de club");
        }
        if (!tenantId && role !== "SUPERADMIN" && role !== "FEDERATION_ADMIN") {
            throw new Error("No puedes crear un torneo interno porque no perteneces a un club (tenantId missing)");
        }
    }

    // Control de Tiempo (Garantizar números válidos, evitar NaN)
    const timeControlMode = formData.get("timeControlMode") as string;
    const hasTimeLimit = timeControlMode === "SHOT_CLOCK" || timeControlMode === "MATCH_TOTAL";
    const secondsPerShot = parseInt(formData.get("secondsPerShot") as string) || 40;
    const extensionsPerPlayer = parseInt(formData.get("extensionsPerPlayer") as string) || 2;
    
    // Nueva Lógica de Estructura Técnica
    const playoffBracketSize = parseInt(formData.get("playoffBracketSize") as string) || 16;
    const groupFormat = formData.get("groupFormat") as string;
    const playersPerGroup = groupFormat === "RR_3" ? 3 : 4;
    const totalGroups = Math.floor(capacity / playersPerGroup);
    const totalClasificados = totalGroups * qualifiedPerGroup;
    
    const diferencia = totalClasificados - playoffBracketSize;
    let requiresAdjustment = false;
    let adjustmentPhaseConfig = undefined;

    if (diferencia > 0) {
        requiresAdjustment = true;
        const playoffPlayers = diferencia * 2;
        const directos = totalClasificados - playoffPlayers;
        adjustmentPhaseConfig = {
            directos,
            playoffPlayers,
            partidos: diferencia,
            ganadores: diferencia,
            puestosPlayoff: `${directos + 1}-${totalClasificados}`
        };
    }

    const config = {
        ...baseConfig,
        maxPlayers: capacity,
        waitingListLimit,
        groupFormat,
        qualifiedPerGroup,
        bracketSize: playoffBracketSize,
        inningsPerPhase,
        timeControl: {
            mode: timeControlMode,
            secondsPerShot,
            extensionsPerPlayer
        }
    };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const sanitizedTenantId = (tenantId && uuidRegex.test(tenantId)) ? tenantId : null;
    const finalTenantId = scope === "INTERNAL" ? sanitizedTenantId : null;

    // Validación Robusta de Fechas (Evita 'Invalid Date' en Prisma)
    let startDate: Date;
    try {
        startDate = startDateRaw ? new Date(startDateRaw) : new Date();
        if (isNaN(startDate.getTime())) startDate = new Date();
    } catch {
        startDate = new Date();
    }

    let endDate: Date | null = null;
    try {
        if (endDateRaw) {
            endDate = new Date(endDateRaw);
            if (isNaN(endDate.getTime())) endDate = null;
        }
    } catch {
        endDate = null;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Mapeo explícito de Enums para evitar fallos de tipo
            const finalDiscipline = (discipline === "THREE_BAND" || discipline === "POOL_CHILENO" || discipline === "POOL_8" || discipline === "POOL_9") 
                ? discipline 
                : "THREE_BAND";
            
            const finalCategory = category || "MASTER";

            const tournament = await tx.tournament.create({
                data: {
                    name: name || "Nueva Competencia 3 Bandas",
                    description: description || "",
                    discipline: finalDiscipline as any,
                    modality: tournamentType || "NO_HANDICAP",
                    category: finalCategory as any,
                    status: status || "DRAFT",
                    scope: scope || "INTERNAL",
                    venue: venueAddress || "Sede Social",
                    venueClubId: (venueClubId && uuidRegex.test(venueClubId)) ? venueClubId : null,
                    venueLogoUrl: (formData.get("venueLogoUrl") as string) || null,
                    tenantId: finalTenantId,
                    createdById: finalUserId,
                    startDate: startDate instanceof Date && !isNaN(startDate.getTime()) ? startDate : new Date(),
                    endDate: endDate instanceof Date && !isNaN(endDate.getTime()) ? endDate : null,
                    hasTimeLimit: Boolean(hasTimeLimit),
                    secondsPerShot: Number(secondsPerShot) || 40,
                    extensionsPerPlayer: Number(extensionsPerPlayer) || 2,
                    config: config || {},
                    officializationStatus: "NONE",

                    // NUEVOS CAMPOS DE DOCUMENTOS
                    // registrationFee,
                    // prizeDistribution,
                    // bankAccountName,
                    // bankAccountRut,
                    // bankName,
                    // bankAccountType,
                    // bankAccountNumber,
                    // bankAccountEmail,
                    // groupFormat: formData.get("groupFormat") as string,
                    // maxCapacity: capacity, // Usamos capacity como maxCapacity por ahora
                    // distanceGroups,
                    // distancePlayoffs,
                    // distanceFinal,
                    // finalUnlimitedInnings,
                    // scheduleDay1Start,
                    // scheduleDay2Start,
                    // registrationContact,
                    // registrationPhone,
                    // registrationDeadline,
                    // groupsPublishDate,
                    // playoffBracketSize,
                    // requiresAdjustment,
                    // adjustmentPhaseConfig: adjustmentPhaseConfig || {},
                    // tournamentStructure: description // Mapeamos description a tournamentStructure
                }
            });

            if (role === "CLUB_DELEGATE" || role === "FEDERATION_DELEGATE") {
                await tx.tournamentAssignment.create({
                    data: {
                        tournamentId: tournament.id,
                        userId: finalUserId,
                        permissions: "OWNER,WRITE_RESULTS"
                    }
                });
            }

            await tx.auditLog.create({
                data: {
                    action: "TOURNAMENT_CREATION",
                    userId: finalUserId,
                    targetId: tournament.id,
                    details: JSON.stringify({
                        name: tournament.name,
                        scope: tournament.scope,
                        discipline: tournament.discipline,
                        timestamp: new Date().toISOString()
                    })
                }
            });

            return tournament;
        });

        revalidatePath("/tournaments");
        return { success: true, id: result.id };
    } catch (error: any) {
        console.error("CRITICAL: Error creating tournament:", error);
        
        const errorMessage = error.message || "Error desconocido";
        return { 
            success: false, 
            error: `Fallo en el servidor: ${errorMessage.substring(0, 100)}`,
            fields: Object.fromEntries(formData.entries())
        };
    }
}

/**
 * Elimina un torneo de forma quirúrgica, asegurando la limpieza de todas las dependencias.
 */
export async function deleteTournament(tournamentId: string) {
    const session = await auth();
    const user = session?.user as any;

    if (!session || !["SUPERADMIN", "FEDERATION_ADMIN"].includes(user?.role)) {
        console.warn(` [DELETE_TOURNAMENT] Intento no autorizado por usuario: ${user?.email || "Anónimo"}`);
        throw new Error("No tienes permisos suficientes para eliminar este torneo.");
    }

    console.log(` [DELETE_TOURNAMENT] Iniciando eliminación del torneo ${tournamentId} por ${user.email}`);

    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { name: true, status: true }
        });

        if (!tournament) {
            console.error(` [DELETE_TOURNAMENT] Torneo no encontrado: ${tournamentId}`);
            throw new Error("El torneo no existe o ya fue eliminado.");
        }

        // Si el torneo ya está en progreso o terminado, advertir más seriamente (aunque el botón lo permita)
        if (tournament.status !== "DRAFT" && user.role !== "SUPERADMIN") {
             console.warn(` [DELETE_TOURNAMENT] Intentando eliminar torneo en estado ${tournament.status}`);
        }

        // Sincronización de usuario para la auditoría (evita fallos de FK si la sesión está desfasada)
        const dbUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: user.id },
                    { email: user.email }
                ]
            },
            select: { id: true }
        });

        if (!dbUser) {
            console.error(` [DELETE_TOURNAMENT] Usuario no encontrado en DB para auditoría: ${user.email}`);
            throw new Error("Sesión inválida o usuario no encontrado en la base de datos.");
        }

        await prisma.$transaction(async (tx) => {
            // 1. Limpieza profunda de dependencias
            await tx.match.deleteMany({ where: { tournamentId } });
            await tx.tournamentRegistration.deleteMany({ where: { tournamentId } });
            await tx.tournamentEnrollment.deleteMany({ where: { tournamentId } });
            await tx.tournamentAssignment.deleteMany({ where: { tournamentId } });
            await tx.tournamentPhase.deleteMany({ where: { tournamentId } });
            await tx.tournamentGroup.deleteMany({ where: { tournamentId } });
            await tx.waitingList.deleteMany({ where: { tournamentId } });
            await tx.tournamentPhoto.deleteMany({ where: { tournamentId } });

            // 2. Eliminar el registro principal
            await tx.tournament.delete({ where: { id: tournamentId } });

            // 3. Auditoría de seguridad con ID real de DB
            await tx.auditLog.create({
                data: {
                    action: "TOURNAMENT_DELETION",
                    details: `Admin ${user.name} (${user.email}) eliminó permanentemente el torneo: ${tournament.name}`,
                    userId: dbUser.id,
                    targetId: tournamentId
                }
            });
        });

        console.log(` [DELETE_TOURNAMENT] Torneo ${tournamentId} eliminado exitosamente.`);
        revalidatePath("/tournaments");
        return { success: true };
    } catch (error: any) {
        console.error(" [DELETE_TOURNAMENT] Error crítico:", error);
        return { 
            success: false, 
            error: error.message || "Error interno del servidor al intentar eliminar el torneo." 
        };
    }
}
