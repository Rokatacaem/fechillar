import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const playersWithoutUser = await prisma.playerProfile.findMany({
        where: {
            userId: null
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            rut: true,
            federationId: true,
            tenantId: true
        }
    });

    console.log(`Total players without user: ${playersWithoutUser.length}`);
    
    const withEmail = playersWithoutUser.filter(p => p.email);
    const withoutEmail = playersWithoutUser.filter(p => !p.email);

    console.log(`Players with email: ${withEmail.length}`);
    console.log(`Players without email: ${withoutEmail.length}`);

    if (withoutEmail.length > 0) {
        console.log('Sample players without email:');
        console.log(withoutEmail.slice(0, 5));
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
