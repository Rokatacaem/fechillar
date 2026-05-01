const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para generar slug
function generateSlug(firstName, lastName) {
  const normalize = (str) => str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${normalize(firstName)}-${normalize(lastName)}`;
}

// Función de fuzzy matching
function fuzzyMatch(searchName, dbFirstName, dbLastName) {
  const normalize = (str) => str.toLowerCase().trim();
  const search = normalize(searchName);
  const forward = normalize(`${dbFirstName} ${dbLastName}`);
  const backward = normalize(`${dbLastName} ${dbFirstName}`);
  return search === forward || search === backward;
}

async function executeOptionC() {
  try {
    console.log('🚀 OPCIÓN C - CONFIGURACIÓN COMPLETA DEL TORNEO MAYO 2026');
    console.log('═══════════════════════════════════════════════════════════\n');

    // ============================================
    // FASE 1: CREAR CLUB PROPOOL Y JUGADORES
    // ============================================
    console.log('📍 FASE 1: Creando club ProPool y jugadores faltantes\n');

    let propool = await prisma.club.findFirst({ where: { name: 'ProPool' } });
    
    if (!propool) {
      console.log('   🏛️  Creando club ProPool...');
      propool = await prisma.club.create({
        data: {
          name: 'ProPool',
          slug: 'propool',
          isValidated: true
        }
      });
      console.log('   ✅ Club creado\n');
    } else {
      console.log('   ✅ Club ProPool ya existe\n');
    }

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

    const missingPlayers = [
      { firstName: 'Ariel', lastName: 'Bernal', club: 'Club La Calera' },
      { firstName: 'Marcos', lastName: 'Garay', club: 'Club La Calera' },
      { firstName: 'Francisco', lastName: 'Guajardo', club: 'Club La Calera' },
      { firstName: 'Julio', lastName: 'Murillo', club: 'Club La Calera' },
      { firstName: 'Yeries', lastName: 'Chahuan', club: 'Club La Calera' },
      { firstName: 'Rigoberto', lastName: 'Oyarzun', club: 'Club La Calera' },
      { firstName: 'Juan Carlos', lastName: 'Ostos', club: 'Club Valparaíso' },
      { firstName: 'Heliberto', lastName: 'Briceño', club: 'Club La Calera' },
      { firstName: 'Hernan', lastName: 'Torres', club: 'Club La Calera' },
      { firstName: 'Patricio', lastName: 'Flores', club: 'Club La Calera' },
      { firstName: 'Cesar', lastName: 'Tobar', club: 'Club Santiago' },
      { firstName: 'Luis', lastName: 'Alfaro', club: 'Club La Calera' },
      { firstName: 'Rodrigo', lastName: 'Mancilla', club: 'Club La Calera' },
      { firstName: 'MANUEL', lastName: 'GOMEZ', club: 'Club Valparaíso' },
      { firstName: 'Eduardo', lastName: 'López', club: 'Club Santiago' },
      { firstName: 'Víctor', lastName: 'Saavedra', club: 'ProPool' },
      { firstName: 'Jamir', lastName: 'Henao', club: 'Club San Miguel' },
      { firstName: 'Irving', lastName: 'Nieves', club: 'ProPool' },
      { firstName: 'Ricardo', lastName: 'Alfaro', club: 'Club La Calera' },
      { firstName: 'Jorge', lastName: 'Decebal', club: 'Club San Miguel' },
      { firstName: 'Felipe', lastName: 'Montaña', club: 'Club San Miguel' }
    ];

    console.log('   👥 Creando jugadores...');
    let created = 0;

    for (const p of missingPlayers) {
      const existing = await prisma.playerProfile.findFirst({
        where: { firstName: p.firstName, lastName: p.lastName }
      });

      if (!existing) {
        await prisma.playerProfile.create({
          data: {
            tenantId: clubs[p.club],
            firstName: p.firstName,
            lastName: p.lastName,
            slug: generateSlug(p.firstName, p.lastName)
          }
        });
        created++;
      }
    }

    console.log(`   ✅ ${created} jugadores creados\n`);

    const totalPlayers = await prisma.playerProfile.count();
    console.log(`   📊 Total jugadores en BD: ${totalPlayers}\n`);

    // ============================================
    // FASE 2: ACTUALIZAR INSCRIPCIONES CON TURNOS
    // ============================================
    console.log('📍 FASE 2: Actualizando inscripciones del torneo\n');

    const tournament = await prisma.tournament.findFirst({
      where: { name: { contains: 'Mayo 2026' } }
    });

    if (!tournament) {
      console.error('   ❌ No se encontró el torneo Mayo 2026');
      return;
    }

    console.log(`   ✅ Torneo: ${tournament.name}`);

    // Eliminar inscripciones actuales
    await prisma.tournamentRegistration.deleteMany({
      where: { tournamentId: tournament.id }
    });
    console.log('   🗑️  Inscripciones anteriores eliminadas\n');

    // Datos de los 55 inscritos con turnos
    const inscritos = [
      { name: "Ulises Salinas D.", turns: ["T1", "T2", "T3"] },
      { name: "Marco Sobarzo", turns: ["T1", "T2", "T3"] },
      { name: "Donato Rodríguez", turns: ["T3"] },
      { name: "José Rodríguez", turns: ["T2"] },
      { name: "Jorge Castillo", turns: ["T2", "T3"] },
      { name: "Mario Díaz", turns: ["T2", "T3"] },
      { name: "Manuel Pulgar", turns: ["T2", "T3"] },
      { name: "Cristian Rioja", turns: ["T2", "T3"] },
      { name: "Emilio Gallardo", turns: ["T2"] },
      { name: "Nelson Salas", turns: ["T2"] },
      { name: "Luis Bustos", turns: ["T3"] },
      { name: "Ricardo Ponce", turns: ["T3"] },
      { name: "Álvaro Serrano", turns: ["T2", "T3"] },
      { name: "Carlos Guerra", turns: ["T1", "T2"] },
      { name: "Marcelo Peña", turns: ["T2", "T3"] },
      { name: "Bladimir Arenas", turns: ["T1", "T2", "T3"] },
      { name: "Carlos Sáenz", turns: ["T3"] },
      { name: "Elvis Gutiérrez", turns: ["T1", "T2", "T3"] },
      { name: "Carlos Olaya", turns: ["T3"] },
      { name: "Pablo Chicurel", turns: ["T1"] },
      { name: "Alejandro Riffo", turns: ["T2"] },
      { name: "Luis Bahamondes", turns: ["T1", "T2", "T3"] },
      { name: "Cristian Rubilar", turns: ["T3"] },
      { name: "Juan Carlos Toro", turns: ["T1", "T2", "T3"] },
      { name: "Rodolfo Silva", turns: ["T1", "T2", "T3"] },
      { name: "Peter Sarmiento", turns: ["T3"] },
      { name: "José Salinas", turns: ["T2"] },
      { name: "Fernando Ramírez", turns: ["T3"] },
      { name: "Ariel Bernal", turns: ["T2"] },
      { name: "Mario Cofre", turns: ["T3"] },
      { name: "Marco Duarte", turns: ["T1", "T2", "T3"] },
      { name: "Pablo Plaza", turns: ["T2", "T3"] },
      { name: "Ricardo Alfaro", turns: ["T1", "T2", "T3"] },
      { name: "Luis Rubino", turns: ["T1", "T2", "T3"] },
      { name: "Camilo Hadad", turns: ["T3"] },
      { name: "Yoiber López", turns: ["T1", "T2", "T3"] },
      { name: "Javier Jiménez", turns: ["T1", "T2", "T3"] },
      { name: "Silvio Matus", turns: ["T1", "T2", "T3"] },
      { name: "Jesús Arenas", turns: ["T1", "T2", "T3"] },
      { name: "Julio Caballero", turns: ["T1", "T2", "T3"] },
      { name: "Arnaldo Paredes", turns: ["T1", "T2", "T3"] },
      { name: "José Naranjo", turns: ["T3"] },
      { name: "Jorge Díaz", turns: ["T1", "T2", "T3"] },
      { name: "Guillermo Sánchez", turns: ["T3"] },
      { name: "Carlos Illanes", turns: ["T1", "T2", "T3"] },
      { name: "Rodrigo Zúñiga", turns: ["T1", "T2", "T3"] },
      { name: "Jorge Trujillo", turns: ["T1", "T2", "T3"] },
      { name: "Rogelio Orozco", turns: ["T1", "T2", "T3"] },
      { name: "Alejandro Carvajal", turns: ["T1", "T2", "T3"] },
      { name: "Robinson Roa", turns: ["T1", "T2", "T3"] },
      { name: "Francisco Marshall", turns: ["T1", "T2", "T3"] },
      { name: "Leopoldo Rojas", turns: ["T1"] },
      { name: "Alfredo Álamos", turns: ["T1", "T2", "T3"] },
      { name: "Edwin Castillo", turns: ["T1", "T2", "T3"] },
      { name: "Víctor Saavedra", turns: ["T1", "T2", "T3"] }
    ];

    const allPlayers = await prisma.playerProfile.findMany({
      select: { id: true, firstName: true, lastName: true }
    });

    console.log('   👥 Inscribiendo jugadores...\n');
    let registered = 0;
    let notFound = [];

    for (const inscrito of inscritos) {
      const player = allPlayers.find(p => 
        fuzzyMatch(inscrito.name, p.firstName, p.lastName)
      );

      if (!player) {
        notFound.push(inscrito.name);
        continue;
      }

      await prisma.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,
          playerId: player.id,
          registeredRank: registered + 1,
          turnAvailability: inscrito.turns
        }
      });

      registered++;
      const turns = inscrito.turns.join(', ');
      console.log(`      ${registered}. ${inscrito.name.padEnd(25)} → ${turns}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ Jugadores en BD: ${totalPlayers}`);
    console.log(`✅ Inscritos al torneo: ${registered}/${inscritos.length}`);

    if (notFound.length > 0) {
      console.log(`\n⚠️  No encontrados (${notFound.length}):`);
      notFound.forEach(name => console.log(`   - ${name}`));
    }

    // Estadísticas de turnos
    const t1Only = inscritos.filter(i => i.turns.length === 1 && i.turns[0] === 'T1').length;
    const t2Only = inscritos.filter(i => i.turns.length === 1 && i.turns[0] === 'T2').length;
    const t3Only = inscritos.filter(i => i.turns.length === 1 && i.turns[0] === 'T3').length;
    const flexible = inscritos.filter(i => i.turns.length > 1).length;

    console.log('\n📊 DISTRIBUCIÓN POR TURNO:');
    console.log(`   Solo T1: ${t1Only} jugadores`);
    console.log(`   Solo T2: ${t2Only} jugadores`);
    console.log(`   Solo T3: ${t3Only} jugadores`);
    console.log(`   Flexibles (2+ turnos): ${flexible} jugadores`);

    console.log('\n🚀 PRÓXIMO PASO:');
    console.log('   1. Ir a: http://localhost:3000/tournaments');
    console.log('   2. Abrir: Torneo Nacional Club Santiago Mayo 2026');
    console.log('   3. Click en: + GRUPOS');
    console.log('   4. El sistema respetará las restricciones de turno\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

executeOptionC();
