import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const tournamentId = '1fa8fea1-4960-4eba-bf71-49fb8539e17d';
        const results = [];

        // 1. Buscar a Victor
        const victor = await prisma.tournamentRegistration.findFirst({
            where: {
                tournamentId,
                player: {
                    OR: [
                        { firstName: { contains: 'Victor', mode: 'insensitive' } },
                        { lastName: { contains: 'Saavedra', mode: 'insensitive' } }
                    ]
                }
            },
            include: { player: true }
        });

        if (victor) {
            results.push(`Encontrado Victor: ${victor.player.firstName} ${victor.player.lastName}`);
            
            // Eliminar partidos
            const deletedMatches = await prisma.match.deleteMany({
                where: {
                    tournamentId,
                    OR: [{ homePlayerId: victor.playerId }, { awayPlayerId: victor.playerId }],
                    homeScore: null
                }
            });
            results.push(`Partidos eliminados: ${deletedMatches.count}`);

            // Eliminar inscripción
            await prisma.tournamentRegistration.delete({ where: { id: victor.id } });
            results.push('Inscripción de Victor eliminada.');
        } else {
            results.push('Victor Saavedra no encontrado en inscripciones.');
        }

        // 2. Buscar e inscribir a Edwin si falta
        const edwin = await prisma.playerProfile.findFirst({
            where: {
                OR: [
                    { firstName: { contains: 'Edwin', mode: 'insensitive' } },
                    { lastName: { contains: 'Castillo', mode: 'insensitive' } }
                ]
            }
        });

        if (edwin) {
            results.push(`Encontrado Edwin: ${edwin.firstName} ${edwin.lastName}`);
            const edwinReg = await prisma.tournamentRegistration.findUnique({
                where: { tournamentId_playerId: { tournamentId, playerId: edwin.id } }
            });

            if (!edwinReg) {
                await prisma.tournamentRegistration.create({
                    data: {
                        tournamentId,
                        playerId: edwin.id,
                        status: 'APPROVED',
                        registeredPoints: 0
                    }
                });
                results.push('Edwin Castillo inscrito correctamente.');
            } else {
                results.push('Edwin Castillo ya estaba inscrito.');
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
