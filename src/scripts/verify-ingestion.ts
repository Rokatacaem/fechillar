import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkData() {
    const tournament = await prisma.tournament.findFirst({
        where: { name: { contains: "San Miguel" } },
        include: {
            matches: true,
            registrations: true
        }
    });

    if (tournament) {
        console.log(`✅ Torneo Encontrado: ${tournament.name}`);
        console.log(`- Inscripciones: ${tournament.registrations.length}`);
        console.log(`- Partidos: ${tournament.matches.length}`);
        console.log(`- Estado: ${tournament.status}`);
    } else {
        console.log("❌ No se encontró ningún torneo con 'San Miguel' en el nombre.");
    }
}

checkData().finally(() => prisma.$disconnect());
