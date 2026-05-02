import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function triggerRecord(tournamentId: string) {
    console.log(`🚀 Iniciando simulador de récord para torneo: ${tournamentId}`);

    try {
        // 1. Buscar el partido más reciente o activo
        const match = await prisma.match.findFirst({
            where: { 
                tournamentId,
                winnerId: null // Aún en juego o listo para actualizar
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!match) {
            console.error("❌ No se encontraron partidos activos en este torneo.");
            return;
        }

        // 2. Definir un valor de récord (ej. 25 carambolas)
        const newRecordValue = 25;

        console.log(`🎯 Extrayendo gloria para el partido ${match.id}`);
        console.log(`📈 Actualizando Serie Mayor a: ${newRecordValue}`);

        await prisma.match.update({
            where: { id: match.id },
            data: {
                homeHighRun: newRecordValue,
                homeScore: { increment: newRecordValue } // Para que se note el cambio
            }
        });

        console.log("✅ Récord inyectado con éxito. Verifica la pantalla de Streaming.");

    } catch (error) {
        console.error("❌ Error al disparar el récord:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Obtener ID desde línea de comandos
const tId = process.argv[2];
if (!tId) {
    console.log("Uso: npx ts-node src/scripts/trigger_record.ts <TOURNAMENT_ID>");
} else {
    triggerRecord(tId);
}
