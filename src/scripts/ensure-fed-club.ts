import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const fedClub = await prisma.club.upsert({
        where: { slug: "sgf-federacion-libres" },
        update: {},
        create: {
            slug: "sgf-federacion-libres",
            name: "Federación Nacional - Jugadores Libres",
            address: "Sede Central SGF",
            city: "Santiago",
            isValidated: true,
            membershipStatus: "VIGENTE"
        }
    });
    console.log(`Federation Club Ready: ${fedClub.id}`);
}

main().finally(() => prisma.$disconnect());
