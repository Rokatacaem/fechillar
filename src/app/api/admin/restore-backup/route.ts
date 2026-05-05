import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { data } = body;

        if (!data) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        console.log("Restaurando datos recibidos vía POST...");

        // 1. Restaurar Clubes (Usamos slug como identificador único para evitar conflictos)
        for (const club of data.clubs) {
            await prisma.club.upsert({
                where: { slug: club.slug },
                update: club,
                create: club
            });
        }

        // 2. Restaurar Usuarios (Usamos email como identificador único)
        if (data.users) {
            for (const user of data.users) {
                await prisma.user.upsert({
                    where: { email: user.email },
                    update: user,
                    create: user
                });
            }
        }

        // 3. Restaurar Jugadores (Usamos slug)
        for (const player of data.players) {
            const { club, user, rankings: _, ...playerData } = player;
            await prisma.playerProfile.upsert({
                where: { slug: player.slug },
                update: playerData,
                create: playerData
            });
        }

        // 4. Restaurar Torneos
        if (data.tournaments) {
            await prisma.tournament.deleteMany({});
            for (const tournament of data.tournaments) {
                const { 
                    hostClub, venueClub, creator, registrations, groups, 
                    registrationFee,
                    adjustmentPhaseConfig, playoffBracketSize, requiresAdjustment, tournamentStructure,
                    ...tData 
                } = tournament;
 
                const cleanData = { ...tData };
                const fieldsToRemove = [
                    'registrationFee', 'adjustmentPhaseConfig', 'playoffBracketSize', 
                    'requiresAdjustment', 'tournamentStructure', 'prizeDistribution',
                    'bankAccountName', 'bankAccountRut', 'bankName', 'bankAccountType',
                    'bankAccountNumber', 'bankAccountEmail', 'groupFormat', 'maxCapacity',
                    'distanceGroups', 'distancePlayoffs', 'distanceFinal', 
                    'finalUnlimitedInnings', 'scheduleDay1Start', 'scheduleDay2Start',
                    'registrationContact', 'registrationPhone', 'registrationDeadline', 
                    'groupsPublishDate'
                ];
                
                fieldsToRemove.forEach(field => {
                    delete (cleanData as any)[field];
                });
                
                await prisma.tournament.create({
                    data: cleanData
                });
            }
        }

        // 5. Restaurar Grupos de Torneos
        if (data.groups) {
            for (const group of data.groups) {
                const { tournament, registrations, ...gData } = group;
                await prisma.tournamentGroup.upsert({
                    where: { id: gData.id },
                    update: gData,
                    create: gData
                });
            }
        }

        // 6. Restaurar Inscripciones
        if (data.registrations) {
            for (const reg of data.registrations) {
                const { player, tournament, group, ...rData } = reg;
                await prisma.tournamentRegistration.upsert({
                    where: { 
                        tournamentId_playerId: {
                            tournamentId: reg.tournamentId,
                            playerId: reg.playerId
                        }
                    },
                    update: rData,
                    create: rData
                });
            }
        }

        // 7. Restaurar Rankings
        if (data.rankings) {
            for (const rank of data.rankings) {
                const { player, ...rankData } = rank;
                await prisma.ranking.upsert({
                    where: { 
                        playerId_discipline_category: {
                            playerId: rank.playerId,
                            discipline: rank.discipline,
                            category: rank.category
                        }
                    },
                    update: rankData,
                    create: rankData
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Restauración completada con éxito",
            stats: {
                clubs: data.clubs.length,
                players: data.players.length,
                tournaments: data.tournaments?.length || 0
            }
        });

    } catch (e: any) {
        console.error("Error en restauración:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
