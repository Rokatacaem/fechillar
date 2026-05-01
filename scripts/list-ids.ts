import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n🔍 LISTADO DE IDS ACTUALES (Post-Seed)\n');

    const tournament = await prisma.tournament.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true }
    });

    if (tournament) {
        console.log('🏆 ÚLTIMO TORNEO CREADO:');
        console.log(`   Nombre: ${tournament.name}`);
        console.log(`   ID:     ${tournament.id}`);
        console.log(`   URL Inscripciones: http://localhost:3000/tournaments/${tournament.id}/inscripciones\n`);
    } else {
        console.log('❌ No se encontraron torneos.\n');
    }

    const clubs = await prisma.club.findMany({
        take: 5,
        select: { id: true, name: true }
    });

    console.log('🏛️ CLUBES DISPONIBLES (Primeros 5):');
    clubs.forEach(club => {
        console.log(`   - ${club.name}: ${club.id}`);
        console.log(`     URL Admin: http://localhost:3000/admin/clubes/${club.id}`);
    });

    console.log('\n--------------------------------------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
