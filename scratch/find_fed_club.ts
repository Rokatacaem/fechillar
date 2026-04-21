import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const clubs = await prisma.club.findMany({
        where: {
            OR: [
                { slug: { contains: "federacion", mode: "insensitive" } },
                { name: { contains: "Federación", mode: "insensitive" } },
                { name: { contains: "Libres", mode: "insensitive" } }
            ]
        },
        select: { id: true, name: true, slug: true }
    });
    console.log(JSON.stringify(clubs, null, 2));
}

main().finally(() => prisma.$disconnect());
