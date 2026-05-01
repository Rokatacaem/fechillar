// scripts/fix-categories-and-handicaps.ts
import { PrismaClient, Discipline, Category } from '@prisma/client';
import { CATEGORY_TARGETS } from '../src/lib/billiards/constants';

const prisma = new PrismaClient();

// Función para determinar categoría según promedio
function getCategoryFromAverage(average: number | null): Category {
  if (!average || average === 0) return Category.FIFTH_B;
  
  if (average >= 0.901) return Category.MASTER;
  if (average >= 0.751) return Category.FIRST;
  if (average >= 0.601) return Category.SECOND;
  if (average >= 0.451) return Category.THIRD;
  if (average >= 0.351) return Category.FOURTH;
  if (average > 0) return Category.FIFTH_A;
  
  return Category.FIFTH_B;
}

async function fixCategoriesAndHandicaps() {
  console.log('🔧 Iniciando corrección de categorías y handicaps...\n');

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
    const correctCategory = getCategoryFromAverage(ranking.average);
    const correctHandicap = CATEGORY_TARGETS[correctCategory];
    
    const currentCategory = ranking.category;
    const currentHandicap = ranking.handicapTarget || 15;

    const needsUpdate = 
      currentCategory !== correctCategory || 
      currentHandicap !== correctHandicap;

    if (needsUpdate) {
      await prisma.ranking.update({
        where: { id: ranking.id },
        data: { 
          category: correctCategory,
          handicapTarget: correctHandicap 
        },
      });

      console.log(
        `✅ ${ranking.player.firstName} ${ranking.player.lastName} | ` +
        `Promedio: ${ranking.average?.toFixed(3) || 'N/A'} | ` +
        `Categoría: ${currentCategory} → ${correctCategory} | ` +
        `Handicap: ${currentHandicap} → ${correctHandicap}`
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

fixCategoriesAndHandicaps()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
