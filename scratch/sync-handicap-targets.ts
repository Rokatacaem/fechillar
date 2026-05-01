import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const matches = await prisma.match.findMany({
        where: {
            tournament: { isHandicap: true }
        },
        include: {
            tournament: true
        }
    });

    console.log(`Encontrados ${matches.length} partidos en torneos con hándicap.`);

    let updatedCount = 0;

    for (const match of matches) {
        let homeTarget = match.homeTarget;
        let awayTarget = match.awayTarget;

        if (match.homePlayerId) {
            const homeReg = await prisma.tournamentRegistration.findUnique({
                where: {
                    tournamentId_playerId: {
                        tournamentId: match.tournamentId,
                        playerId: match.homePlayerId
                    }
                }
            });
            if (homeReg && homeReg.registeredHandicap) {
                homeTarget = homeReg.registeredHandicap;
            }
        }

        if (match.awayPlayerId) {
            const awayReg = await prisma.tournamentRegistration.findUnique({
                where: {
                    tournamentId_playerId: {
                        tournamentId: match.tournamentId,
                        playerId: match.awayPlayerId
                    }
                }
            });
            if (awayReg && awayReg.registeredHandicap) {
                awayTarget = awayReg.registeredHandicap;
            }
        }

        if (homeTarget !== match.homeTarget || awayTarget !== match.awayTarget) {
            await prisma.match.update({
                where: { id: match.id },
                data: { homeTarget, awayTarget }
            });
            updatedCount++;
        }
    }

    console.log(`✅ Se actualizaron ${updatedCount} partidos con las metas correctas desde sus inscripciones.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
