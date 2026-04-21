
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlayer() {
    try {
        const player = await prisma.playerProfile.findFirst({
            where: {
                user: {
                    name: { contains: 'HADAD', mode: 'insensitive' }
                }
            },
            include: { user: true }
        });
        
        if (player) {
            console.log("JUGADOR ENCONTRADO:");
            console.log("ID:", player.id);
            console.log("Nombre:", player.user.name);
            console.log("PhotoURL:", player.photoUrl || "NULA");
            console.log("PublicSlug:", player.publicSlug || "NULO");
            console.log("Slug:", player.slug || "NULO");
        } else {
            console.log("Jugador no encontrado.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPlayer();
