import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BracketViewer } from "@/components/tournament/BracketViewer"
import { matchesToBracket, getBracketProgress } from "@/lib/billiards/bracket-automation"

export default async function BracketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect("/login")

  const resolvedParams = await params;
  
  const tournament = await prisma.tournament.findUnique({
    where: { id: resolvedParams.id },
    include: {
      phases: { orderBy: { order: 'asc' } },
      matches: {
        where: { groupId: null },
        orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
        include: {
          homePlayer: { select: { id: true, firstName: true, lastName: true, photoUrl: true }},
          awayPlayer: { select: { id: true, firstName: true, lastName: true, photoUrl: true }},
        }
      }
    }
  })

  if (!tournament) {
    return <div>Torneo no encontrado</div>
  }

  if (tournament.matches.length === 0) {
    return <div>No hay bracket generado. Ve a Grupos y genera las llaves.</div>
  }

  const bracket = matchesToBracket(resolvedParams.id, tournament.matches)
  const progress = getBracketProgress(bracket)

  const playerMap: Record<string, { name: string; photoUrl?: string }> = {}
  for (const m of tournament.matches) {
    if (m.homePlayer) {
      playerMap[m.homePlayer.id] = {
        name: `${m.homePlayer.firstName} ${m.homePlayer.lastName}`,
        photoUrl: m.homePlayer.photoUrl ?? undefined
      }
    }
    if (m.awayPlayer) {
      playerMap[m.awayPlayer.id] = {
        name: `${m.awayPlayer.firstName} ${m.awayPlayer.lastName}`,
        photoUrl: m.awayPlayer.photoUrl ?? undefined
      }
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Llaves · <span className="text-amber-400">{tournament.name}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Fase eliminatoria — Eliminación directa
          </p>
        </div>

        {/* Badge de progreso */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progreso</p>
            <p className="text-2xl font-black text-white">{progress.percentage}%</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Partidas</p>
            <p className="text-lg font-black text-slate-300">
              {progress.completedMatches}
              <span className="text-slate-600 font-medium">/{progress.totalMatches}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{
            width: `${progress.percentage}%`,
            background: progress.percentage === 100
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : "linear-gradient(90deg, #f59e0b, #fbbf24)",
          }}
        />
      </div>

      {/* Bracket */}
      <BracketViewer
        bracket={bracket}
        playerMap={playerMap}
      />
    </div>
  )
}
