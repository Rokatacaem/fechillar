const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clubs = await prisma.club.findMany({
        select: { name: true, slug: true }
    });
    console.log('CLUBS EN LA BASE DE DATOS:');
    console.log(JSON.stringify(clubs, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
