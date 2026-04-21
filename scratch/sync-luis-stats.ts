import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🛠️ Actualizando récords de Luis para validación de arquitectura...");

    const luis = await prisma.user.findFirst({
        where: { name: { contains: "Luis" } },
        include: { playerProfile: true }
    });

    if (!luis || !luis.playerProfile) {
        console.error("❌ Luis no encontrado");
        return;
    }

    // 1. Actualizar Ranking base
    await prisma.ranking.upsert({
        where: {
            playerId_discipline_category: {
                playerId: luis.playerProfile.id,
                discipline: "THREE_BAND",
                category: "HONOR"
            }
        },
        update: {
            average: 1.322,
            points: 150 // Valor ejemplo
        },
        create: {
            playerId: luis.playerProfile.id,
            discipline: "THREE_BAND",
            category: "HONOR",
            average: 1.322,
            points: 150
        }
    });

    // 2. Actualizar un partido para la mayor tacada
    const match = await prisma.match.findFirst({
        where: { homePlayerId: luis.playerProfile.id }
    });

    if (match) {
        await prisma.match.update({
            where: { id: match.id },
            data: {
                homeHighRun: 11,
                homeScore: 40,
                homeInnings: 30 // 30 entradas -> 1.333 aprox
            }
        });
        console.log("✅ Partido de Luis actualizado con Tacada de 11.");
    } else {
        console.warn("⚠️ No se encontró partido para actualizar tacada.");
    }

    console.log("🚀 Sincronización de Luis finalizada.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
