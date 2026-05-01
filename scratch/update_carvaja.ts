import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePlayer() {
    console.log("🔍 Buscando a Alejandro Carvaja...");
    
    const players = await prisma.playerProfile.findMany({
        where: {
            AND: [
                { firstName: { contains: 'Alejandro', mode: 'insensitive' } },
                { lastName: { contains: 'Carvaja', mode: 'insensitive' } }
            ]
        }
    });

    if (players.length === 0) {
        console.error("❌ No se encontró ningún jugador con ese nombre.");
        return;
    }

    if (players.length > 1) {
        console.warn("⚠️ Se encontró más de un jugador. Por favor verifica los IDs:");
        console.table(players.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, rut: p.rut })));
        return;
    }

    const player = players[0];
    console.log(`✅ Jugador encontrado: ${player.firstName} ${player.lastName} (ID: ${player.id})`);
    console.log(`📈 Promedio actual: ${player.averageBase}`);

    const updated = await prisma.playerProfile.update({
        where: { id: player.id },
        data: {
            averageBase: 0.957
        }
    });

    // También actualizar en el ranking si existe para THREE_BAND
    await prisma.ranking.updateMany({
        where: { 
            playerId: player.id,
            discipline: 'THREE_BAND'
        },
        data: {
            average: 0.957
        }
    });

    console.log(`🚀 ¡Actualización exitosa! Nuevo promedio: ${updated.averageBase}`);
}

updatePlayer()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
