"use server"

import prisma from "@/lib/prisma"
import { advanceWinner, matchesToBracket } from "@/lib/billiards/bracket-automation"
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
    where: { id: input.matchId },
    include: { tournament: true, phase: true }
  })

  if (!match) throw new Error("Partida no encontrada")
  if (match.winnerId) throw new Error("La partida ya tiene resultado")

  const allMatches = await prisma.match.findMany({
    where: { 
      tournamentId: match.tournamentId,
      phaseId: match.phaseId 
    },
    orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }]
  })

  const bracket = matchesToBracket(match.tournamentId, allMatches)
  const updatedBracket = advanceWinner(bracket, input.matchId, input.winnerId)

  await prisma.$transaction(async (tx) => {
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

    const updatedMatch = updatedBracket.matches.find(m => m.id === input.matchId)
    if (updatedMatch?.winnerGoesToMatchId) {
      const nextMatch = updatedBracket.matches.find(m => m.id === updatedMatch.winnerGoesToMatchId)
      if (nextMatch) {
        const slot = nextMatch.homePlayerId === null ? 'homePlayerId' : 'awayPlayerId'
        await tx.match.update({
          where: { id: nextMatch.id },
          data: { [slot]: input.winnerId }
        })
      }
    }
  })

  revalidatePath(`/tournaments/${match.tournamentId}/bracket`)
  return { success: true }
}
