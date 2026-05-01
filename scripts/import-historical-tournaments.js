const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Normaliza texto removiendo tildes y convirtiéndolo a mayúsculas
 */
function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Busca un jugador por nombre usando fuzzy matching mejorado
 * Maneja: orden invertido, tildes, nombres compuestos, mayúsculas/minúsculas
 */
async function findPlayerByName(name) {
  const cleanName = name.trim();
  const parts = cleanName.split(' ').filter(p => p.length > 0);

  if (parts.length === 0) return null;

  // Estrategia 1: Buscar por nombre completo normalizado
  const normalizedSearch = normalize(cleanName);

  let player = await prisma.playerProfile.findFirst({
    where: {
      OR: [
        // Buscar en firstName
        { firstName: { contains: cleanName, mode: 'insensitive' } },
        // Buscar en lastName
        { lastName: { contains: cleanName, mode: 'insensitive' } }
      ]
    }
  });

  if (player) return player;

  // Estrategia 2: Separar en partes y probar todas las combinaciones
  if (parts.length >= 2) {
    const [part1, part2, ...rest] = parts;

    // Caso: "RODRIGO ZUÑIGA" -> firstName:"Rodrigo" lastName:"Zúñiga"
    player = await prisma.playerProfile.findFirst({
      where: {
        AND: [
          { firstName: { contains: part1, mode: 'insensitive' } },
          { lastName: { contains: part2, mode: 'insensitive' } }
        ]
      }
    });

    if (player) return player;

    // Caso: "ZUÑIGA RODRIGO" -> lastName:"Zúñiga" firstName:"Rodrigo"
    player = await prisma.playerProfile.findFirst({
      where: {
        AND: [
          { lastName: { contains: part1, mode: 'insensitive' } },
          { firstName: { contains: part2, mode: 'insensitive' } }
        ]
      }
    });

    if (player) return player;

    // Caso: Nombres compuestos "JUAN CARLOS TORO"
    if (rest.length > 0) {
      const firstName = `${part1} ${part2}`; // "Juan Carlos"
      const lastName = rest.join(' '); // "Toro"

      player = await prisma.playerProfile.findFirst({
        where: {
          AND: [
            { firstName: { contains: firstName, mode: 'insensitive' } },
            { lastName: { contains: lastName, mode: 'insensitive' } }
          ]
        }
      });

      if (player) return player;

      // Invertido: "TORO JUAN CARLOS"
      player = await prisma.playerProfile.findFirst({
        where: {
          AND: [
            { lastName: { contains: part1, mode: 'insensitive' } },
            { firstName: { contains: `${part2} ${rest.join(' ')}`, mode: 'insensitive' } }
          ]
        }
      });

      if (player) return player;
    }
  }

  // Estrategia 3: Solo por apellido (última opción, menos precisa)
  if (parts.length > 0) {
    player = await prisma.playerProfile.findFirst({
      where: {
        OR: [
          { lastName: { contains: parts[0], mode: 'insensitive' } },
          { lastName: { contains: parts[parts.length - 1], mode: 'insensitive' } }
        ]
      }
    });
  }

  return player;
}

/**
 * Importa un torneo histórico con sus resultados
 */
async function importTournament(name, startDate, endDate, resultsFile, venue) {
  console.log('════════════════════════════════════════════════════════════');
  console.log(`📊 Importando: ${name}`);
  console.log(`📅 ${startDate.toLocaleDateString('es-CL')} - ${endDate.toLocaleDateString('es-CL')}`);
  console.log('════════════════════════════════════════════════════════════');

  // Leer archivo JSON
  const filePath = path.join(__dirname, '..', 'backups', resultsFile);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`);
    return;
  }

  const results = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`👥 Participantes en JSON: ${results.length}`);
  console.log(`🏠 Sede: ${venue}`);

  // 1. Crear el torneo
  const tournament = await prisma.tournament.create({
    data: {
      name,
      startDate,
      endDate,
      registrationDeadline: startDate,
      discipline: 'THREE_BAND',
      category: 'MASTER',
      status: 'FINISHED',
      venue: venue,
      maxCapacity: results.length,
      description: `Torneo histórico importado desde Excel`,
      scope: 'NATIONAL'
    }
  });

  console.log(`✅ Torneo creado: ${tournament.id}`);

  let inscribedCount = 0;
  let updatedRankings = 0;
  let notFound = [];
  let skipped = [];

  // 2. Procesar cada resultado
  for (const result of results) {
    // Buscar jugador con fuzzy matching mejorado
    const player = await findPlayerByName(result.player);

    if (!player) {
      notFound.push(result.player);
      continue;
    }

    // Verificar duplicado solo en ESTE torneo específico
    const existingRegistration = await prisma.tournamentRegistration.findFirst({
      where: {
        playerId: player.id,
        tournamentId: tournament.id
      }
    });

    if (existingRegistration) {
      console.log(`   ⚠️  ${result.player} ya inscrito en este torneo`);
      skipped.push(result.player);
      continue;
    }

    // 3. Crear inscripción
    await prisma.tournamentRegistration.create({
      data: {
        tournamentId: tournament.id,
        playerId: player.id,
        status: 'APPROVED',
        paymentStatus: 'PAID',
        registeredRank: result.position,
        registeredPoints: result.points || 0,
        registeredAverage: result.average || 0
      }
    });

    inscribedCount++;

    // 4. Actualizar Ranking Nacional (THREE_BAND)
    const ranking = await prisma.ranking.findFirst({
      where: {
        playerId: player.id,
        discipline: 'THREE_BAND'
      }
    });

    if (ranking && result.points > 0) {
      await prisma.ranking.update({
        where: { id: ranking.id },
        data: {
          points: ranking.points + result.points
        }
      });

      // Crear snapshot histórico
      await prisma.rankingSnapshot.create({
        data: {
          playerId: player.id,
          discipline: 'THREE_BAND',
          category: 'MASTER',
          points: ranking.points + result.points,
          rankPosition: ranking.rankPosition || 999,
          average: result.average || 0,
          snapshotDate: endDate
        }
      });

      updatedRankings++;
    }
  }

  // Resumen
  console.log('📋 RESULTADOS DE IMPORTACIÓN:');
  console.log(`   ✅ Inscritos:            ${inscribedCount}/${results.length}`);
  console.log(`   📊 Rankings actualizados: ${updatedRankings}`);

  if (skipped.length > 0) {
    console.log(`   ⚠️  Duplicados (${skipped.length}): Ya inscritos en este torneo`);
  }

  if (notFound.length > 0) {
    console.log(`   ⚠️  No encontrados (${notFound.length}):`);
    notFound.forEach(name => console.log(`      - ${name}`));
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 IMPORTACIÓN DE TORNEOS HISTÓRICOS (FUZZY MATCHING MEJORADO)');
    console.log('🔍 Maneja: orden invertido, tildes, nombres compuestos\n');

    const backupsDir = path.join(__dirname, '..', 'backups');
    console.log(`📁 Directorio de datos: ${backupsDir}`);

    // Verificar que existen los JSON
    const files = fs.readdirSync(backupsDir);
    console.log(`📄 Archivos JSON disponibles: ${files.filter(f => f.endsWith('.json')).join(', ')}\n`);

    // Importar Open La Calera 2026
    await importTournament(
      'Open La Calera 2026',
      new Date('2026-02-28'),
      new Date('2026-03-01'),
      'la_calera.json',
      'Club La Calera'
    );

    // Importar Open San Miguel 2026
    await importTournament(
      'Open San Miguel 2026',
      new Date('2026-04-04'),
      new Date('2026-04-05'),
      'san_miguel.json',
      'Club San Miguel'
    );

    console.log('\n🎉 ¡PROCESO COMPLETO!');
    console.log('Verifica en:');
    console.log('  • Torneos:  http://localhost:3000/tournaments');
    console.log('  • Padrón:   http://localhost:3000/padron-nacional');
    console.log('  • Studio:   npx prisma studio');

  } catch (error) {
    console.error('\n❌ Error durante la importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();