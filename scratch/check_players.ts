import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const players = await prisma.playerProfile.findMany({
        take: 50,
        orderBy: { id: 'desc' },
        include: {
            club: { select: { name: true } }
        }
    });

    console.log("=== ÚLTIMOS 50 JUGADORES ===");
    players.forEach(p => {
        console.log(`[${p.id}] ${p.slug} - RUT: ${p.rut} - FED: ${p.federationId} - CLUB: ${p.club?.name || 'SIN CLUB'}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
