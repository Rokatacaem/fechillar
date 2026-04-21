import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("--- Reporte de Torneos Nacionales ---");
    const tournaments = await prisma.tournament.findMany({
        orderBy: { startDate: 'asc' },
        select: { id: true, name: true, startDate: true, discipline: true, category: true, status: true, scope: true }
    });
    
    // Agrupamiento manual para detectar duplicados (Nombre + Fecha + Categoría)
    const seen = new Map();
    const duplicates = [];

    for (const t of tournaments) {
        const key = `${t.name}-${t.startDate.toISOString()}-${t.category}`;
        if (seen.has(key)) {
            duplicates.push(t.id);
            console.log(`[!] DUPLICADO DETECTADO: ${t.name} (${t.startDate.toDateString()}) - ID: ${t.id}`);
        } else {
            seen.set(key, t.id);
        }
    }

    console.log(`\nTotal Torneos: ${tournaments.length}`);
    console.log(`Total Duplicados a Purgar: ${duplicates.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
