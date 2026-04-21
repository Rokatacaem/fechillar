import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    console.log("RECENT AUDIT LOGS:");
    console.table(logs.map(l => ({
        id: l.id,
        action: l.action,
        userId: l.userId,
        createdAt: l.createdAt
    })));

    const tournaments = await prisma.tournament.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log("\nRECENT TOURNAMENTS:");
    console.table(tournaments.map(t => ({
        id: t.id,
        name: t.name,
        createdById: t.createdById,
        createdAt: t.createdAt
    })));
}

check().finally(() => prisma.$disconnect());
