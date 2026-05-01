import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TournamentManager from "@/components/tournament/TournamentManager";
import { calculatePhaseStates } from "@/lib/tournament/phase-manager";

export default async function TournamentGestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      groups: {
        include: {
          matches: {
            include: {
              homePlayer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  club: { select: { name: true } },
                },
              },
              awayPlayer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  club: { select: { name: true } },
                },
              },
            },
            orderBy: { matchOrder: "asc" },
          },
          registrations: {
            include: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  club: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
      matches: {
        where: { groupId: null },
        include: {
          homePlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              club: { select: { name: true } },
            },
          },
          awayPlayer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              club: { select: { name: true } },
            },
          },
        },
        orderBy: [{ round: "asc" }, { matchOrder: "asc" }],
      },
      hostClub: {
        select: { name: true },
      },
    },
  });

  if (!tournament) {
    redirect("/tournaments");
  }

  // Calcular estados de fases
  const allMatches = [
    ...tournament.groups.flatMap((g) => g.matches),
    ...tournament.matches,
  ];

  const basePhases = calculatePhaseStates(
    allMatches as any,
    tournament.groups.length > 0
  );

  // Enriquecer fases con datos reales
  const enrichedPhases = basePhases.map((phase) => {
    // Asignar nombre del icono basado en el ID
    let iconName = "Target";
    if (phase.id === "groups") iconName = "Users";
    else if (phase.id === "adjustment") iconName = "GitMerge";
    else if (phase.id === "round_4") iconName = "Trophy";
    else if (phase.id === "round_2") iconName = "Award";
    else if (phase.id === "final") iconName = "Crown";

    if (phase.id === "groups") {
      return {
        ...phase,
        iconName,
        groups: tournament.groups,
      };
    }

    if (phase.id === "adjustment") {
      const adjustmentMatches = tournament.matches.filter((m) => m.round === 0);
      const groupsCompleted = tournament.groups.every((g) => 
        g.matches.every((m) => m.winnerId || m.isWO || (m.homeInnings && m.homeInnings > 0))
      );
      
      return {
        ...phase,
        iconName,
        matches: adjustmentMatches,
        canGenerate: groupsCompleted && adjustmentMatches.length === 0
      };
    }

    // Otras fases de eliminación
    const roundNumber = parseInt(phase.id.replace("round_", ""));
    if (!isNaN(roundNumber)) {
      const roundMatches = tournament.matches.filter((m) => m.round === roundNumber);
      return {
        ...phase,
        iconName,
        matches: roundMatches,
      };
    }

    return { ...phase, iconName };
  });

  return (
    <TournamentManager
      tournamentId={tournament.id}
      tournamentName={tournament.name}
      discipline={tournament.discipline}
      venue={tournament.hostClub ? tournament.hostClub.name : "Sede Central"}
      phases={enrichedPhases as any}
      onGenerateBracket={undefined}
    />
  );
}
