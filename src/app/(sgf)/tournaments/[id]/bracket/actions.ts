"use server"

import prisma from "@/lib/prisma"
import { matchesToBracket } from "@/lib/billiards/bracket-automation"
import { revalidatePath } from "next/cache"

export async function advanceMatch(input: {
  matchId: string
  winnerId: string
  homeScore: number
  awayScore: number
  homeInnings: number
  awayInnings: number
  homeHighRun?: number
  awayHighRun?: number
  isWO?: boolean
}) {
  const match = await prisma.match.findUnique({
    where: { id: input.matchId }
  })

  if (!match) throw new Error("Partida no encontrada")

  const previousWinnerId = match.winnerId // null si es primera vez, string si ya existía

  const allMatches = await prisma.match.findMany({
    where: {
      tournamentId: match.tournamentId,
      groupId: null,
    },
    orderBy: [{ round: "asc" }, { matchOrder: "asc" }]
  })

  const bracket = matchesToBracket(match.tournamentId, allMatches)
  const currentBracketMatch = bracket.matches.find(m => m.id === input.matchId)

  await prisma.$transaction(async (tx) => {
    // 1. Actualizar la partida con los nuevos valores
    await tx.match.update({
      where: { id: input.matchId },
      data: {
        winnerId: input.winnerId,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        homeInnings: input.homeInnings,
        awayInnings: input.awayInnings,
        homeHighRun: input.homeHighRun ?? 0,
        awayHighRun: input.awayHighRun ?? 0,
        isWO: input.isWO ?? false,
      }
    })

    // 2. Propagar ganador al siguiente partido (si existe)
    if (currentBracketMatch?.winnerGoesToMatchId) {
      const nextMatchDb = allMatches.find(m => m.id === currentBracketMatch.winnerGoesToMatchId)
      if (!nextMatchDb) return

      // Solo tocamos el siguiente partido si todavía no tiene resultado definitivo
      if (nextMatchDb.winnerId) return

      let updateData: { homePlayerId?: string; awayPlayerId?: string } = {}

      if (previousWinnerId && previousWinnerId !== input.winnerId) {
        // Ganador cambió: reemplazar el jugador anterior en el slot correspondiente
        if (nextMatchDb.homePlayerId === previousWinnerId) {
          updateData = { homePlayerId: input.winnerId }
        } else if (nextMatchDb.awayPlayerId === previousWinnerId) {
          updateData = { awayPlayerId: input.winnerId }
        }
      } else if (!previousWinnerId) {
        // Primera vez: asignar al slot vacío
        if (!nextMatchDb.homePlayerId) {
          updateData = { homePlayerId: input.winnerId }
        } else if (!nextMatchDb.awayPlayerId) {
          updateData = { awayPlayerId: input.winnerId }
        }
      }

      if (Object.keys(updateData).length > 0) {
        await tx.match.update({
          where: { id: nextMatchDb.id },
          data: updateData
        })
      }
    }
  })

  revalidatePath(`/tournaments/${match.tournamentId}/bracket`)
  return { success: true }
}
