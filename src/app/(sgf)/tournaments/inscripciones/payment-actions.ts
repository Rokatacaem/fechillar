"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function confirmPayment(registrationId: string, amount: number, paymentRef: string) {
    const session = await auth();
    
    if (!session?.user?.id) {
        throw new Error("No autorizado");
    }

    const userId = session?.user?.id as string || (session?.user as any)?.id;
    const userEmail = session?.user?.email as string;

    if (!userId) {
        throw new Error("No se pudo identificar al validador (ID de sesión ausente)");
    }

    // --- LÓGICA DE AUTO-SANACIÓN PARA ADMIN ---
    let validatorUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!validatorUser && userEmail === "admin@fechillar.cl") {
        console.log(" [PAYMENT_FIX] Admin user not found in DB, creating with session ID:", userId);
        validatorUser = await prisma.user.create({
            data: {
                id: userId,
                email: userEmail,
                name: session?.user?.name || "Desconocido" || "Rodrigo Zúñiga (Admin)",
                role: "SUPERADMIN",
                passwordHash: "admin123"
            }
        });
    }

    if (!validatorUser) {
        throw new Error(`Inconsistencia de identidad: Tu ID de usuario (${userId}) no existe en la base de datos. Por favor, cierra sesión y vuelve a entrar.`);
    }

    // Verificar si el usuario tiene privilegios de auditoría
    const validRoles = ["CLUB_DELEGATE", "CLUB_ADMIN", "FEDERATION_DELEGATE", "FEDERATION_ADMIN", "SUPERADMIN"];
    if (!validRoles.includes(validatorUser.role)) {
        throw new Error("Privilegios insuficientes para validar pagos");
    }

    try {
        const registration = await prisma.tournamentRegistration.findUnique({
            where: { id: registrationId }
        });

        if (!registration) throw new Error("Registro no encontrado");

        if (registration.paymentStatus === "PAID") {
            throw new Error("Este registro ya fue pagado y validado");
        }

        await prisma.tournamentRegistration.update({
            where: { id: registrationId },
            data: {
                paid: true,
                paymentStatus: "PAID",
                amountPaid: amount,
                paymentRef: paymentRef || "N/A",
                paidAt: new Date(),
                validatorId: validatorUser.id,
                status: "APPROVED" // Al pagar, asume la aprobación formal al evento
            }
        });

        revalidatePath(`/tournaments/${registration.tournamentId}/inscripciones`);
        return { success: true };
    } catch (error: any) {
        console.error("Error validating payment:", error);
        return { success: false, error: error.message || "Error interno al validar pago" };
    }
}
