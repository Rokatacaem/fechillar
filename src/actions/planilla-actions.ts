"use server";

import prisma from "@/lib/prisma";
import { ScoreSheetData } from "@/lib/pdf/score-sheet-generator";

export async function getPlanillaData(tournamentId: string, phase: string): Promise<{ success: boolean; data?: ScoreSheetData[]; error?: string }> {
    try {
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { hostClub: true }
        });

        if (!tournament) return { success: false, error: "Torneo no encontrado" };

        const tournamentTitle = tournament.name;
        const clubSede = tournament.hostClub?.name || tournament.venue || "Club Sede";
        const dateStr = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }) : "";
        const fullSede = `${clubSede} ${dateStr}`;

        let scoreSheets: ScoreSheetData[] = [];

        if (phase.toLowerCase().includes("grupo")) {
            // Caso especial: Grupos
            // Buscamos los grupos y sus jugadores
            const groups = await prisma.tournamentGroup.findMany({
                where: { tournamentId },
                include: {
                    registrations: {
                        where: { status: "APPROVED" },
                        include: {
                            player: {
                                include: {
                                    club: true,
                                    user: true
                                }
                            }
                        },
                        orderBy: { groupOrder: 'asc' }
                    }
                },
                orderBy: { order: 'asc' }
            });

            for (const group of groups) {
                const players = group.registrations.map(r => ({
                    name: r.player.user?.name || `${r.player.firstName} ${r.player.lastName}`,
                    club: r.player.club?.name || "Sin Club"
                }));

                // Generar emparejamientos round-robin (todos contra todos)
                let matchNo = 1;
                for (let i = 0; i < players.length; i++) {
                    for (let j = i + 1; j < players.length; j++) {
                        scoreSheets.push({
                            tournamentTitle,
                            clubSede: fullSede,
                            phase: "Fase de Grupos",
                            player1: players[i],
                            player2: players[j],
                            group: group.name,
                            matchNo: matchNo.toString(),
                            tableNo: "" // Se llena a mano o se asigna luego
                        });
                        matchNo++;
                    }
                }
            }
        } else {
            // Caso general: Brackets/Eliminatorias
            // Buscamos en la tabla Match filtrando por la fase
            // Primero buscamos si existe una TournamentPhase con ese nombre
            const tournamentPhase = await prisma.tournamentPhase.findFirst({
                where: { 
                    tournamentId,
                    name: { contains: phase, mode: 'insensitive' }
                }
            });

            const matches = await prisma.match.findMany({
                where: {
                    tournamentId,
                    phaseId: tournamentPhase?.id
                },
                include: {
                    homePlayer: { include: { club: true, user: true } },
                    awayPlayer: { include: { club: true, user: true } }
                },
                orderBy: { matchOrder: 'asc' }
            });

            scoreSheets = matches.map((m, idx) => ({
                tournamentTitle,
                clubSede: fullSede,
                phase: phase,
                player1: {
                    name: m.homePlayer?.user?.name || (m.homePlayer ? `${m.homePlayer.firstName} ${m.homePlayer.lastName}` : "TBD"),
                    club: m.homePlayer?.club?.name || ""
                },
                player2: {
                    name: m.awayPlayer?.user?.name || (m.awayPlayer ? `${m.awayPlayer.firstName} ${m.awayPlayer.lastName}` : "TBD"),
                    club: m.awayPlayer?.club?.name || ""
                },
                group: "",
                matchNo: (m.matchOrder || idx + 1).toString(),
                tableNo: m.tableNumber || ""
            }));
        }

        return { success: true, data: scoreSheets };

    } catch (error: any) {
        console.error("Error al obtener datos para planillas:", error);
        return { success: false, error: error.message };
    }
}
