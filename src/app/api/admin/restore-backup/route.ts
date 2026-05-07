import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function stripNested(obj: Record<string, any>) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => typeof v !== 'object' || v === null)
    );
}

export async function POST(req: Request) {
    const syncSecret = process.env.SYNC_SECRET;
    if (!syncSecret || req.headers.get("x-sync-secret") !== syncSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { data } = body;

        if (!data) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        console.log("Restaurando datos recibidos vía POST...");

        // 1. Restaurar Clubes
        for (const club of data.clubs) {
            const { id, ...fields } = stripNested(club);
            await prisma.club.upsert({
                where: { slug: fields.slug as string },
                update: fields as any,
                create: { id, ...fields } as any,
            });
        }

        // 2. Restaurar Usuarios (si el backup los incluye)
        if (data.users) {
            for (const user of data.users) {
                const { id, ...fields } = stripNested(user);
                await prisma.user.upsert({
                    where: { email: fields.email as string },
                    update: fields as any,
                    create: { id, ...fields } as any,
                });
            }
        }

        // 3. Restaurar Jugadores
        for (const player of data.players) {
            const { id, ...fields } = stripNested(player);
            try {
                await prisma.playerProfile.upsert({
                    where: { slug: fields.slug as string },
                    update: fields as any,
                    create: { id, ...fields } as any,
                });
            } catch (err: any) {
                // Si falla por FK de userId (usuario no existe en esta DB), reintentar sin él
                if (err.message?.includes('userId') || err.message?.includes('PlayerProfile_userId_fkey')) {
                    const { userId: _u, ...fieldsNoUser } = fields as any;
                    await prisma.playerProfile.upsert({
                        where: { slug: fieldsNoUser.slug as string },
                        update: fieldsNoUser as any,
                        create: { id, ...fieldsNoUser } as any,
                    });
                } else {
                    throw err;
                }
            }
        }

        // 4. Restaurar Torneos (delete + recreate para evitar conflictos de id)
        if (data.tournaments) {
            await prisma.tournament.deleteMany({});

            const fieldsToRemove = [
                'registrationFee', 'adjustmentPhaseConfig', 'playoffBracketSize',
                'requiresAdjustment', 'tournamentStructure', 'prizeDistribution',
                'bankAccountName', 'bankAccountRut', 'bankName', 'bankAccountType',
                'bankAccountNumber', 'bankAccountEmail', 'groupFormat', 'maxCapacity',
                'distanceGroups', 'distancePlayoffs', 'distanceFinal',
                'finalUnlimitedInnings', 'scheduleDay1Start', 'scheduleDay2Start',
                'registrationContact', 'registrationPhone', 'registrationDeadline',
                'groupsPublishDate', 'officializationStatus',
                // relaciones anidadas
                'hostClub', 'venueClub', 'creator', 'registrations', 'groups',
            ];

            const cleanTournaments = data.tournaments.map((t: any) => {
                const clean = stripNested(t);
                fieldsToRemove.forEach(f => delete clean[f]);
                return clean;
            });

            await prisma.tournament.createMany({ data: cleanTournaments, skipDuplicates: true });
        }

        // 5. Restaurar Grupos
        if (data.groups) {
            for (const group of data.groups) {
                const { id, ...fields } = stripNested(group);
                delete fields.order;
                await prisma.tournamentGroup.upsert({
                    where: { id },
                    update: fields as any,
                    create: { id, ...fields } as any,
                });
            }
        }

        // 6. Restaurar Inscripciones
        if (data.registrations) {
            for (const reg of data.registrations) {
                const { id, ...fields } = stripNested(reg);
                delete fields.turnPreference;
                delete fields.preferredTurn;
                await prisma.tournamentRegistration.upsert({
                    where: {
                        tournamentId_playerId: {
                            tournamentId: fields.tournamentId as string,
                            playerId: fields.playerId as string,
                        },
                    },
                    update: fields as any,
                    create: { id, ...fields } as any,
                });
            }
        }

        // 7. Restaurar Rankings
        if (data.rankings) {
            for (const rank of data.rankings) {
                const { id, ...fields } = stripNested(rank);
                await prisma.ranking.upsert({
                    where: {
                        playerId_discipline_category: {
                            playerId: fields.playerId as string,
                            discipline: fields.discipline as any,
                            category: fields.category as any,
                        },
                    },
                    update: fields as any,
                    create: { id, ...fields } as any,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Restauración completada con éxito",
            stats: {
                clubs: data.clubs?.length ?? 0,
                players: data.players?.length ?? 0,
                rankings: data.rankings?.length ?? 0,
                tournaments: data.tournaments?.length ?? 0,
                registrations: data.registrations?.length ?? 0,
            },
        });

    } catch (e: any) {
        console.error("Error en restauración:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
