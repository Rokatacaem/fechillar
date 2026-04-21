"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { MembershipStatus } from "@prisma/client";
import { addYears, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

/**
 * Valida o renueva la membresía de un jugador con un solo clic.
 * Extiende la validez por 1 año desde hoy.
 */
export async function validateMembershipQuick(playerId: string, amount: number) {
    const session = await auth();
    
    // Roles permitidos: Rodrigo (SuperAdmin), Federación o Admin General
    const allowedRoles = ["SUPERADMIN", "FEDERATION_ADMIN", "ADMIN", "CLUB_ADMIN"];
    
    if (!session || !allowedRoles.includes((session.user as any).role)) {
        throw new Error(`No autorizado (${(session?.user as any).role || 'Invitado'}). Se requiere nivel administrativo.`);
    }

    console.log("🛠️ Iniciando habilitación rápida para:", playerId);

    // Resiliencia: Asegurar que el validador existe en la DB actual antes de auditar
    const dbAdmin = await prisma.user.upsert({
        where: { email: session.user.email as string },
        update: {},
        create: {
            email: session.user.email as string,
            name: session.user.name || "Administrador SGF",
            role: (session.user as any).role || "SUPERADMIN"
        },
        select: { id: true, name: true, email: true }
    });

    const validatorId = dbAdmin.id;

    try {
        const user = await prisma.user.findFirst({
            where: { playerProfile: { id: playerId } },
            include: { playerProfile: true }
        });

        if (!user) throw new Error("Operación denegada: Este es un Perfil Provisional (generado por carga masiva). El jugador o su Club deben completar el registro de la cuenta digital antes de poder recibir una habilitación oficial.");

        const today = startOfDay(new Date());
        const oneYearLater = addYears(today, 1);

        // Saneamiento de UUID para el validador
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const finalValidatorId = (validatorId && uuidRegex.test(validatorId)) ? validatorId : null;

        // Creamos o actualizamos el registro de membresía
        const membership = await prisma.membership.create({
            data: {
                userId: user.id,
                amount: amount,
                lastAmount: amount,
                status: MembershipStatus.PAID,
                validUntil: oneYearLater,
                lastPaymentDate: today,
                validatedAt: today,
                validatedById: finalValidatorId,
                paymentReference: `MANUAL_SGF_${Date.now()}`
            }
        });

        // Auditoría Reforzada (Requerida por el Comandante)
        await prisma.auditLog.create({
            data: {
                action: "CLUB_MEMBERSHIP_VALIDATED",
                userId: validatorId,
                targetId: user.id,
                details: JSON.stringify({
                    amount,
                    validUntil: oneYearLater,
                    validator: (session.user as any).name,
                    validatorEmail: (session.user as any).email,
                    timestamp: new Date().toISOString(),
                    method: "QUICK_ADMIN_VALIDATION"
                })
            }
        });

        // Asegurar consistencia inmediata en vistas críticas
        revalidatePath("/federacion/padron");
        revalidatePath("/admin/dashboard");
        revalidatePath("/dashboard"); 
        revalidatePath("/tournaments"); 
        
        return { success: true, validUntil: oneYearLater };

    } catch (error: any) {
        console.error("Error validating membership:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene el padrón con filtros de búsqueda y club.
 */
export async function getFederatedCensus(search?: string, clubId?: string) {
    const where: any = {};

    if (clubId) {
        where.tenantId = clubId;
    }

    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { rut: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } }
        ];
    }

    return await prisma.playerProfile.findMany({
        where,
        include: {
            user: {
                include: {
                    memberships: {
                        orderBy: { validUntil: 'desc' },
                        take: 1
                    }
                }
            },
            club: true
        },
        orderBy: { user: { name: 'asc' } }
    });
}
