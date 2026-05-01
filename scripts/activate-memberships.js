const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Activa membresías federadas (tipo ANNUAL, status PAID)
 * para todos los jugadores que tengan un User vinculado.
 *
 * Jugadores sin User (sin cuenta) se reportan al final.
 */
async function activateAllMemberships() {
  try {
    console.log('🔄 Activando membresías para jugadores con cuenta...\n');

    const players = await prisma.playerProfile.findMany({
      include: {
        user: {
          include: { memberships: true }
        }
      }
    });

    console.log(`📊 Total jugadores activos: ${players.length}`);

    let created = 0;
    let updated = 0;
    let skippedNoUser = 0;

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1); // Válida por 1 año

    for (const player of players) {
      if (!player.userId || !player.user) {
        skippedNoUser++;
        continue;
      }

      const existing = player.user.memberships.find(
        (m) => m.type === 'ANNUAL'
      );

      if (!existing) {
        await prisma.membership.create({
          data: {
            userId: player.userId,
            type: 'ANNUAL',
            status: 'PAID',
            amount: 0,
            validUntil
          }
        });
        created++;
      } else if (existing.status !== 'PAID') {
        await prisma.membership.update({
          where: { id: existing.id },
          data: {
            status: 'PAID',
            validUntil
          }
        });
        updated++;
      }
    }

    console.log(`\n✅ Resultados:`);
    console.log(`   Membresías creadas:      ${created}`);
    console.log(`   Membresías actualizadas:  ${updated}`);
    console.log(`   Sin cuenta (ignorados):   ${skippedNoUser}`);
    console.log(`   Total procesados:         ${players.length}`);

    if (skippedNoUser > 0) {
      console.log(`\n⚠️  ${skippedNoUser} jugadores no tienen User vinculado.`);
      console.log(`   Para activar su membresía, primero deben crear una cuenta.`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

activateAllMemberships();
