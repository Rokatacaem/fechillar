"use server";

import { PrismaClient, MembershipStatus, EnrollmentPaymentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getPlayerStanding } from "@/lib/standing";
import prisma from "@/lib/prisma";

/**
 * Valida manualmente un pago de membresía o inscripción.
 * Usado por Delegados de Club.
 */
export async function validateManualPayment(
    targetId: string, 
    type: "MEMBERSHIP" | "ENROLLMENT", 
    reference?: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("No autorizado o sesión inválida");
    }


    const caller = await prisma.user.findUnique({
        where: { id: (session?.user as any)?.id }
    });

    if (!caller || !["SUPERADMIN", "FEDERATION_ADMIN", "CLUB_DELEGATE", "CLUB_ADMIN"].includes(caller.role)) {
        throw new Error("Permisos insuficientes para validar pagos.");
    }

    try {
        await prisma.$transaction(async (tx) => {
            if (type === "MEMBERSHIP") {
                await tx.membership.update({
                    where: { id: targetId },
                    data: {
                        status: MembershipStatus.PAID,
                        paymentReference: reference,
                        validatedAt: new Date(),
                        validatedById: (session?.user as any)?.id
                    }
                });
            } else {
                await tx.tournamentEnrollment.update({
                    where: { id: targetId },
                    data: {
                        paymentStatus: EnrollmentPaymentStatus.PAID,
                        paymentReference: reference,
                        validatedAt: new Date(),
                        validatedById: (session?.user as any)?.id
                    }
                });
            }

            // Log de Auditoría
            await tx.auditLog.create({
                data: {
                    action: `manual_payment_validation_${type.toLowerCase()}`,
                    targetId: targetId,
                    userId: (session?.user as any)?.id,
                    details: JSON.stringify({
                        reference,
                        timestamp: new Date().toISOString(),
                        validatorName: session?.user?.name || "Administrador"
                    })
                }
            });
        });

        revalidatePath("/admin/dashboard");
        revalidatePath("/dashboard/inscripciones");
        return { success: true };
    } catch (error: any) {
        console.error("Payment Validation Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Inscribe a un jugador en un torneo.
 * Solo si su standing es GREEN.
 */
export async function enrollInTournament(playerId: string, tournamentId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autorizado");

    const standing = await getPlayerStanding(playerId);
    if (standing.status === "RED") {
        throw new Error(`Inscripción Bloqueada: ${standing.message}`);
    }

    try {
        const enrollment = await prisma.tournamentEnrollment.create({
            data: {
                userId: playerId,
                tournamentId: tournamentId,
                paymentStatus: EnrollmentPaymentStatus.PENDING // Comienza como pendiente hasta que el delegado lo valide
            }
        });

        revalidatePath("/dashboard/inscripciones");
        return { success: true, enrollmentId: enrollment.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Override de SuperAdmin para perdonar deudas o forzar inscripción.
 */
export async function forceEnrollmentOverride(enrollmentId: string) {
    const session = await auth();
    if (!session?.user?.id || (session?.user as any)?.role !== "SUPERADMIN") {
        throw new Error("Acción reservada para SuperAdmin.");
    }

    await prisma.tournamentEnrollment.update({
        where: { id: enrollmentId },
        data: {
            paymentStatus: EnrollmentPaymentStatus.PAID,
            validatedAt: new Date(),
            validatedById: (session?.user as any)?.id,
            paymentReference: "SUPERADMIN_OVERRIDE"
        }
    });

    revalidatePath("/admin/dashboard");
    return { success: true };
}
