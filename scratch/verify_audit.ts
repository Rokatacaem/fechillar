import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyAuditLogs() {
    console.log("🔍 Verificando logs de auditoría comerciales...");
    
    // Buscar el log más reciente de TOURNAMENT_CREATION o similar
    // Nota: El action en createTournament (si existe) debería ser auditado.
    // Actualmente createTournament NO TIENE auditLog.create explícito. 
    // SOLO validateMembershipQuick lo tiene.

    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log("Recientes:");
    logs.forEach(l => console.log(`[${l.createdAt.toISOString()}] ${l.action} - ${l.details}`));
}

verifyAuditLogs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
