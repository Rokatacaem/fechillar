import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const clubs = await prisma.club.findMany({
        where: { name: { contains: "Santiago", mode: "insensitive" } },
        select: { id: true, name: true, legalStatus: true }
    });
    console.log(JSON.stringify(clubs, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
