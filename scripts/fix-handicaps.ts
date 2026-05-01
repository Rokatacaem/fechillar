// scripts/fix-handicaps.ts
import { PrismaClient, Discipline } from '@prisma/client';
import { CATEGORY_TARGETS } from '../src/lib/billiards/constants';

const prisma = new PrismaClient();

async function fixHandicaps() {
  console.log('🔧 Iniciando corrección de handicaps...\n');

  const rankings = await prisma.ranking.findMany({
    where: {
      discipline: Discipline.THREE_BAND,
    },
    include: {
      player: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log(`📊 Encontrados ${rankings.length} jugadores de 3 Bandas\n`);

  let fixed = 0;
  let alreadyCorrect = 0;

  for (const ranking of rankings) {
    const correctHandicap = CATEGORY_TARGETS[ranking.category];
    const currentHandicap = ranking.handicapTarget || 15;

    if (currentHandicap !== correctHandicap) {
      await prisma.ranking.update({
        where: { id: ranking.id },
        data: { handicapTarget: correctHandicap },
      });

      console.log(
        `✅ ${ranking.player.firstName} ${ranking.player.lastName} | ` +
        `Categoría: ${ranking.category} | ` +
        `${currentHandicap} → ${correctHandicap}`
      );
      fixed++;
    } else {
      alreadyCorrect++;
    }
  }

  console.log(`\n✨ Proceso completado:`);
  console.log(`   - Corregidos: ${fixed}`);
  console.log(`   - Ya correctos: ${alreadyCorrect}`);
  console.log(`   - Total procesados: ${rankings.length}`);
}

fixHandicaps()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
