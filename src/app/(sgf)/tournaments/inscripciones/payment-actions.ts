"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function confirmPayment(registrationId: string, amount: number, paymentRef: string) {
    const session = await auth();
    
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    const role = (session.user as any).role;
    const userId = session.user.id;

    // Verificar si el usuario tiene privilegios de auditoría
    const validRoles = ["CLUB_DELEGATE", "CLUB_ADMIN", "FEDERATION_DELEGATE", "FEDERATION_ADMIN", "SUPERADMIN"];
    if (!validRoles.includes(role)) {
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
                validatorId: userId,
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
