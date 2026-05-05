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

        // 1. Restaurar Clubes
        for (const club of data.clubs) {
            // Eliminar cualquier relación anidada para evitar nested creates
            const cleanClub = Object.fromEntries(Object.entries(club).filter(([_, v]) => typeof v !== 'object' || v === null));
            await prisma.club.upsert({
                where: { slug: cleanClub.slug as string },
                update: cleanClub as any,
                create: cleanClub as any
            });
        }

        // 2. Restaurar Usuarios
        if (data.users) {
            for (const user of data.users) {
                const cleanUser = Object.fromEntries(Object.entries(user).filter(([_, v]) => typeof v !== 'object' || v === null));
                await prisma.user.upsert({
                    where: { email: cleanUser.email as string },
                    update: cleanUser as any,
                    create: cleanUser as any
                });
            }
        }

        // 3. Restaurar Jugadores
        for (const player of data.players) {
            const cleanPlayer = Object.fromEntries(Object.entries(player).filter(([_, v]) => typeof v !== 'object' || v === null));
            await prisma.playerProfile.upsert({
                where: { slug: cleanPlayer.slug as string },
                update: cleanPlayer as any,
                create: cleanPlayer as any
            });
        }

        // 4. Restaurar Torneos
        if (data.tournaments) {
            await prisma.tournament.deleteMany({});
            
            const cleanTournaments = data.tournaments.map((tournament: any) => {
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
                
                return cleanData;
            });

            await prisma.tournament.createMany({
                data: cleanTournaments,
                skipDuplicates: true
            });
        }

        // 5. Restaurar Grupos de Torneos
        if (data.groups) {
            for (const group of data.groups) {
                const cleanGroup = Object.fromEntries(Object.entries(group).filter(([_, v]) => typeof v !== 'object' || v === null));
                await prisma.tournamentGroup.upsert({
                    where: { id: cleanGroup.id as string },
                    update: cleanGroup as any,
                    create: cleanGroup as any
                });
            }
        }

        // 6. Restaurar Inscripciones
        if (data.registrations) {
            for (const reg of data.registrations) {
                const cleanReg = Object.fromEntries(Object.entries(reg).filter(([_, v]) => typeof v !== 'object' || v === null));
                await prisma.tournamentRegistration.upsert({
                    where: { 
                        tournamentId_playerId: {
                            tournamentId: cleanReg.tournamentId as string,
                            playerId: cleanReg.playerId as string
                        }
                    },
                    update: cleanReg as any,
                    create: cleanReg as any
                });
            }
        }

        // 7. Restaurar Rankings
        if (data.rankings) {
            for (const rank of data.rankings) {
                const cleanRank = Object.fromEntries(Object.entries(rank).filter(([_, v]) => typeof v !== 'object' || v === null));
                await prisma.ranking.upsert({
                    where: { 
                        playerId_discipline_category: {
                            playerId: cleanRank.playerId as string,
                            discipline: cleanRank.discipline as any,
                            category: cleanRank.category as any
                        }
                    },
                    update: cleanRank as any,
                    create: cleanRank as any
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
