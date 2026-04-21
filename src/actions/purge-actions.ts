"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function executeEnvironmentPurge() {
    const session = await auth();
    
    // Normalización de email para evitar bloqueos por mayúsculas
    const userEmail = session?.user?.email?.toLowerCase();
    const adminEmail = "admin@fechillar.cl".toLowerCase();

    if (!session || !session.user || userEmail !== adminEmail) {
        return { success: false, error: "Autorización denegada. Solo el Administrador Maestro puede purificar el entorno." };
    }

    try {
        console.log("🔥 INICIANDO PURGA TOTAL SOLICITADA POR:", userEmail);
        
        const result = await prisma.$transaction(async (tx) => {
            // 1. Limpieza de Tablas Transaccionales (Orden de abajo hacia arriba)
            await tx.match.deleteMany({});
            await tx.tournamentRegistration.deleteMany({});
            await tx.tournamentEnrollment.deleteMany({});
            await tx.tournamentAssignment.deleteMany({});
            await tx.waitingList.deleteMany({});
            await tx.tournamentGroup.deleteMany({});
            await tx.tournamentPhase.deleteMany({});
            await tx.tournamentPhoto.deleteMany({});
            await tx.tournament.deleteMany({});

            // 2. Rankings y Historial
            const txAny = tx as any;
            if (txAny.rankingSnapshot) await txAny.rankingSnapshot.deleteMany({});
            await tx.ranking.deleteMany({});
            await tx.transferRequest.deleteMany({});

            // 3. Trámites y Finanzas
            await tx.workflowRequest.deleteMany({});
            await tx.membership.deleteMany({});
            await tx.financeRecord.deleteMany({});
            if (txAny.transparencyDocument) await txAny.transparencyDocument.deleteMany({});

            // 4. Perfiles y Logs Relacionados
            await tx.playerProfile.deleteMany({});
            
            // 5. Clubes y Miembros de Directiva
            if (txAny.clubMember) await txAny.clubMember.deleteMany({});
            await tx.user.updateMany({
                data: { managedClubId: null }
            });
            await tx.club.deleteMany({});

            // 6. Usuarios (Preservando solo ADMIN MAESTRO)
            await tx.user.deleteMany({
                where: { email: { not: "admin@fechillar.cl" } }
            });

            // Recuperar el ID real del administrador persistente
            const persistentAdmin = await tx.user.findUnique({
                where: { email: "admin@fechillar.cl" },
                select: { id: true }
            });

            if (!persistentAdmin) {
                throw new Error("Fallo Crítico: El Administrador Maestro no existe tras la purga.");
            }

            // 7. Reinicio Total de Auditoría
            await tx.auditLog.deleteMany({});

            // 8. Registro de Firma Digital de Purificación
            await tx.auditLog.create({
                data: {
                    action: "ENTORNO_PURIFICADO_SGF",
                    userId: persistentAdmin.id,
                    details: JSON.stringify({
                        message: "NUCLEAR PURGE COMPLETE: Sistema en estado virgen.",
                        timestamp: new Date().toISOString()
                    })
                }
            });

            return { status: "CLEAN" };
        }, {
            timeout: 30000 
        });

        // Forzar revalidación total de rutas administrativas
        revalidatePath("/admin", "layout");
        revalidatePath("/(sgf)", "layout");
        
        return { success: true, message: "Entorno purificado satisfactoriamente." };

    } catch (error: any) {
        console.error("Purge Error Detail:", error);
        return { success: false, error: "Error en la base de datos: " + error.message };
    }
}
