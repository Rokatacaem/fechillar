const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMissingPlayersAndClub() {
  try {
    console.log('🚀 AGREGANDO CLUB Y JUGADORES FALTANTES');
    console.log('═══════════════════════════════════════\n');

    // 1. Crear club ProPool (sin campo 'status')
    console.log('🏛️  Creando club ProPool...');
    const propool = await prisma.club.create({
      data: {
        name: 'ProPool',
        slug: 'propool',
        isValidated: true,
        membershipStatus: 'ACTIVE'
      }
    });
    console.log(`✅ Club creado: ${propool.name} (ID: ${propool.id})\n`);

    // 2. Obtener IDs de clubes existentes
    const clubValparaiso = await prisma.club.findFirst({ where: { name: 'Club Valparaíso' } });
    const clubLaCalera = await prisma.club.findFirst({ where: { name: 'Club La Calera' } });
    const clubSanMiguel = await prisma.club.findFirst({ where: { name: 'Club San Miguel' } });
    const clubSantiago = await prisma.club.findFirst({ where: { name: 'Club Santiago' } });

    const clubs = {
      'Club Valparaíso': clubValparaiso.id,
      'Club La Calera': clubLaCalera.id,
      'Club San Miguel': clubSanMiguel.id,
      'Club Santiago': clubSantiago.id,
      'ProPool': propool.id
    };

    // 3. Definir los 20 jugadores
    const players = [
      // La Calera
      { firstName: 'Marcos', lastName: 'Garay', club: 'Club La Calera' },
      { firstName: 'Francisco', lastName: 'Guajardo', club: 'Club La Calera' },
      { firstName: 'Julio', lastName: 'Murillo', club: 'Club La Calera' },
      { firstName: 'Yeries', lastName: 'Chahuán', club: 'Club La Calera' },
      { firstName: 'Rigoberto', lastName: 'Oyarzún', club: 'Club La Calera' },
      { firstName: 'Juan Carlos', lastName: 'Ostos', club: 'Club Valparaíso' },
      { firstName: 'Heliberto', lastName: 'Briceño', club: 'Club La Calera' },
      { firstName: 'Hernan', lastName: 'Torres', club: 'Club La Calera' },
      { firstName: 'Patricio', lastName: 'Flores', club: 'Club La Calera' },
      { firstName: 'Cesar', lastName: 'Tobar', club: 'Club Santiago' },
      { firstName: 'Luis', lastName: 'Alfaro', club: 'Club La Calera' },
      { firstName: 'Rodrigo', lastName: 'Mancilla', club: 'Club La Calera' },
      { firstName: 'Manuel', lastName: 'Gómez', club: 'Club Valparaíso' },

      // San Miguel
      { firstName: 'Eduardo', lastName: 'López', club: 'Club Santiago' },
      { firstName: 'Víctor', lastName: 'Saavedra', club: 'ProPool' },
      { firstName: 'Jamir', lastName: 'Henao', club: 'Club San Miguel' },
      { firstName: 'Irving', lastName: 'Nieves', club: 'ProPool' },
      { firstName: 'Ricardo', lastName: 'Alfaro', club: 'Club La Calera' },
      { firstName: 'Jorge', lastName: 'Decebal', club: 'Club San Miguel' },
      { firstName: 'Felipe', lastName: 'Montaña', club: 'Club San Miguel' }
    ];

    console.log('👥 Creando 20 jugadores...\n');

    let created = 0;
    for (const p of players) {
      const player = await prisma.playerProfile.create({
        data: {
          userId: null,
          clubId: clubs[p.club],
          firstName: p.firstName,
          lastName: p.lastName,
          status: 'ACTIVE'
        }
      });

      created++;
      console.log(`   ${created}/20 ✅ ${p.firstName} ${p.lastName} - ${p.club}`);
    }

    console.log('\n🎉 ¡COMPLETADO EXITOSAMENTE!');
    console.log('═══════════════════════════════════════');
    console.log(`✅ 1 club creado (ProPool)`);
    console.log(`✅ 20 jugadores creados`);
    console.log('\n📋 PRÓXIMO PASO:');
    console.log('   Re-importar torneos históricos:');
    console.log('   1. node scripts/delete-historical-tournaments.js');
    console.log('   2. node scripts/import-historical-tournaments.js');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingPlayersAndClub();