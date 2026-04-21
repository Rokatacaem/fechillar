
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tournamentId = process.argv[2];
    if (!tournamentId) {
        console.log("Provide tournamentId");
        return;
    }

    const regs = await prisma.tournamentRegistration.findMany({
        where: { tournamentId },
        select: { id: true, status: true, groupId: true }
    });

    console.log(`Total registrations for ${tournamentId}: ${regs.length}`);
    const counts = regs.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {} as any);
    console.log("Status counts:", counts);

    const groups = await prisma.tournamentGroup.findMany({
        where: { tournamentId },
        select: { id: true, name: true }
    });
    console.log(`Groups found: ${groups.length}`);
    for (const g of groups) {
        const count = regs.filter(r => r.groupId === g.id).length;
        console.log(` - ${g.name} (${g.id}): ${count} players`);
    }

    const unassigned = regs.filter(r => r.groupId === null).length;
    console.log(`Unassigned: ${unassigned}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
