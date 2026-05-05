
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  try {
    const count = await prisma.playerProfile.count();
    console.log('Total players count:', count);

    const players = await prisma.playerProfile.findMany({
      take: 5,
      include: {
        club: true,
        user: {
          include: {
            memberships: {
              where: { type: "ANNUAL" },
              orderBy: { validUntil: "desc" },
              take: 1
            }
          }
        },
        rankings: {
          where: {
            discipline: {
              in: ['THREE_BAND', 'THREE_BAND_ANNUAL']
            }
          }
        }
      }
    });
    console.log('Players found (sample 5):', players.length);
    if (players.length > 0) {
        console.log('First player:', JSON.stringify(players[0], null, 2));
    }
  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
