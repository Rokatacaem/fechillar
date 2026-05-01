"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function overrideMatchScore(matchId: string, actionPayload: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autorizado");

    const role = (session?.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "FEDERATION_ADMIN") {
        throw new Error("Privilegios insuficientes para anulación por Switcher");
    }

    const { type, playerTarget, value } = actionPayload;

    // AQUI IRIAMOS A ALTERAR EL MODELO MATCH REAL
    // await prisma.match.update(...)

    // AUDIT LOG CRÍTICO MANDATORIO
    await prisma.auditLog.create({
        data: {
            action: `override_${type}_${playerTarget}`,
            targetId: matchId,
            userId: (session?.user as any)?.id,
            details: JSON.stringify({
                event: "[STREAM_OVERRIDE]",
                context: "Intervención Operador de Cámaras Local (Control Maestro)",
                appliedValue: value,
                timestamp: new Date().toISOString()
            })
        }
    });

    // Inyectarlo vía el Wrapper WebSockets para forzar en tablet y TV
    // await emitToPusher(matchId, { action: "sync_forced", ... });

    revalidatePath(`/admin/streaming`);
    return { success: true };
}
