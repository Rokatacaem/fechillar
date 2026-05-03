import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const backupPath = path.join(process.cwd(), "backups", "backup-2026-04-30T04-17-19.json");
        
        if (!fs.existsSync(backupPath)) {
            return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
        }

        const fileContent = fs.readFileSync(backupPath, "utf-8");
        const backup = JSON.parse(fileContent);
        const { data } = backup;

        console.log("Restaurando datos desde backup...");

        // 1. Restaurar Clubes
        for (const club of data.clubs) {
            await prisma.club.upsert({
                where: { id: club.id },
                update: club,
                create: club
            });
        }

        // 2. Restaurar Usuarios (Importante para relaciones)
        if (data.users) {
            for (const user of data.users) {
                await prisma.user.upsert({
                    where: { id: user.id },
                    update: user,
                    create: user
                });
            }
        }

        // 3. Restaurar Jugadores
        for (const player of data.players) {
            // Limpiamos relaciones que podrían fallar si el target no existe aún
            const { club, user, ...playerData } = player;
            await prisma.playerProfile.upsert({
                where: { id: player.id },
                update: playerData,
                create: playerData
            });
        }

        // 4. Restaurar Torneos
        if (data.tournaments) {
            for (const tournament of data.tournaments) {
                const { hostClub, venueClub, creator, registrations, groups, ...tData } = tournament;
                await prisma.tournament.upsert({
                    where: { id: tournament.id },
                    update: tData,
                    create: tData
                });
            }
        }

        // 5. Restaurar Grupos de Torneos
        if (data.groups) {
            for (const group of data.groups) {
                const { tournament, registrations, ...gData } = group;
                await prisma.tournamentGroup.upsert({
                    where: { id: group.id },
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
                    where: { id: reg.id },
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
                    where: { id: rank.id },
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
