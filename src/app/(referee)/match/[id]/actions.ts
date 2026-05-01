import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function syncMatchState(matchId: string, payload: any) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("Unauthorized Access: Session invalid.");
    }
    
    const userId = session?.user?.id as string || "system";
    
    try {
        // Ejecución en paralelo: Audit Log + Update de Estado
        // Esto aumenta la presión de escritura para la prueba de estrés
        const [audit, updatedMatch] = await Promise.all([
            prisma.auditLog.create({
                data: {
                    action: payload.action || "UPDATE_MATCH_STATE",
                    targetId: matchId,
                    userId: userId,
                    details: JSON.stringify({
                        event: payload.action,
                        context: payload,
                        timestamp: new Date().toISOString()
                    })
                }
            }),
            prisma.match.update({
                where: { id: matchId },
                data: {
                    homeScore: payload.homeScore ?? undefined,
                    awayScore: payload.awayScore ?? undefined,
                    homeInnings: payload.homeInnings ?? undefined,
                    awayInnings: payload.awayInnings ?? undefined,
                    homeHighRun: payload.homeHighRun ?? undefined,
                    awayHighRun: payload.awayHighRun ?? undefined,
                }
            })
        ]);

        return { 
            success: true, 
            recordedBy: userId, 
            matchId: updatedMatch.id,
            timestamp: new Date().toISOString()
        };

    } catch (error: any) {
        console.error("Sync Match State Error:", error);
        return { success: false, error: error.message };
    }
}
