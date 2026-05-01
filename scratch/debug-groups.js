const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGroups() {
    const tournament = await prisma.tournament.findFirst({
        where: { name: { contains: 'Mayo 2026' } },
        include: { groups: true }
    });

    if (!tournament) {
        console.log('No tournament found');
        return;
    }

    console.log('Tournament:', tournament.name, 'ID:', tournament.id);
    console.log('Groups count:', tournament.groups.length);
    tournament.groups.forEach(g => {
        console.log(`- ${g.name} (ID: ${g.id})`);
    });
}

checkGroups();
