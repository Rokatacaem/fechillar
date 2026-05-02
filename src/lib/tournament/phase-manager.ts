/**
 * Helper para calcular el estado de las fases del torneo
 * Ubicación: src/lib/tournament/phase-manager.ts
 */

export interface PhaseDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  requiredCompletedPhase?: string;
}

export const TOURNAMENT_PHASES: PhaseDefinition[] = [
  {
    id: "groups",
    name: "Fase de Grupos",
    slug: "grupos",
    description: "Grupos round-robin",
  },
  {
    id: "adjustment",
    name: "Fase de Ajuste",
    slug: "ajuste",
    description: "Repechaje clasificados",
    requiredCompletedPhase: "groups",
  },
  {
    id: "round_16",
    name: "16avos de Final",
    slug: "16avos",
    description: "Eliminación directa",
    requiredCompletedPhase: "adjustment",
  },
  {
    id: "round_8",
    name: "Octavos de Final",
    slug: "octavos",
    description: "Eliminación directa",
    requiredCompletedPhase: "round_16",
  },
  {
    id: "round_4",
    name: "Cuartos de Final",
    slug: "cuartos",
    description: "Eliminación directa",
    requiredCompletedPhase: "round_8",
  },
  {
    id: "round_2",
    name: "Semifinales",
    slug: "semifinales",
    description: "Penúltima ronda",
    requiredCompletedPhase: "round_4",
  },
  {
    id: "final",
    name: "Final",
    slug: "final",
    description: "Definición del campeón",
    requiredCompletedPhase: "round_2",
  },
];

export type PhaseStatus = "completed" | "active" | "locked";

export interface PhaseState {
  id: string;
  name: string;
  slug: string;
  status: PhaseStatus;
  matchesCompleted: number;
  matchesTotal: number;
  description: string;
}

interface Match {
  id: string;
  round: number;
  winnerId: string | null;
  isWO: boolean;
  groupId: string | null;
  phaseId?: string | null;
  homeInnings?: number | null;
}

/**
 * Calcula el estado de todas las fases del torneo
 */
export function calculatePhaseStates(
  matches: Match[],
  hasGroups: boolean
): PhaseState[] {
  const states: PhaseState[] = [];
  
  const isMatchCompleted = (m: Match) => 
    m.winnerId !== null || m.isWO || (m.homeInnings !== undefined && m.homeInnings !== null && m.homeInnings > 0);

  // Fase de Grupos
  const groupMatches = matches.filter(m => m.groupId !== null);
  const groupsCompleted = groupMatches.length > 0 
    ? groupMatches.every(isMatchCompleted)
    : false;
  
  states.push({
    id: "groups",
    name: "Fase de Grupos",
    slug: "grupos",
    status: groupsCompleted ? "completed" : "active", // Permitir acceso siempre para sorteo
    matchesCompleted: groupMatches.filter(isMatchCompleted).length,
    matchesTotal: groupMatches.length,
    description: "Grupos round-robin",
  });

  // Fase de Ajuste (Barrage) - Identificada por round 0
  const adjustmentMatches = matches.filter(m => m.groupId === null && m.round === 0);
  const adjustmentCompleted = adjustmentMatches.length > 0 && adjustmentMatches.every(isMatchCompleted);
  
  const groupsMatches = matches.filter(m => m.groupId !== null);
  const groupsDone = groupsMatches.length > 0 && groupsMatches.every(isMatchCompleted);

  const totalRounds = Math.max(...matches.filter(m => m.groupId === null && m.round > 0).map(m => m.round), 0);
  
  states.push({
    id: "adjustment",
    name: "Fase de Ajuste (Barrage)",
    slug: "ajuste",
    status: !groupsDone 
      ? "locked" 
      : (adjustmentMatches.length > 0 && adjustmentCompleted) 
      ? "completed" 
      : (groupsDone && (adjustmentMatches.length > 0 || totalRounds === 0))
      ? "active"
      : "locked",
    matchesCompleted: adjustmentMatches.filter(isMatchCompleted).length,
    matchesTotal: adjustmentMatches.length,
    description: "Repechaje para cuadro de 32",
  });

  // Rondas de eliminación (1, 2, 3, 4, 5...)
  // Si hay 32 jugadores, hay 5 rondas: 32 -> 16 -> 8 -> 4 -> 2 -> 1
  // Pero a veces el sistema las numera 1 a 5.
  
  const getRoundName = (round: number, totalRounds: number) => {
    const diff = totalRounds - round;
    if (diff === 0) return { name: "Final", slug: "final" };
    if (diff === 1) return { name: "Semifinales", slug: "semifinales" };
    if (diff === 2) return { name: "Cuartos de Final", slug: "cuartos" };
    if (diff === 3) return { name: "Octavos de Final", slug: "octavos" };
    if (diff === 4) return { name: "16avos de Final", slug: "16avos" };
    return { name: `Ronda ${round}`, slug: `ronda-${round}` };
  };

  let previousPhaseDone = adjustmentCompleted || (groupsDone && adjustmentMatches.length === 0);

  for (let r = 1; r <= totalRounds; r++) {
    const roundMatches = matches.filter(m => m.groupId === null && m.round === r && m.phaseId === null); // assuming elimination matches have no phaseId or a different one
    if (roundMatches.length === 0) continue;

    const roundCompleted = roundMatches.every(isMatchCompleted);
    const def = getRoundName(r, totalRounds);

    states.push({
      id: `round_${r}`,
      name: def.name,
      slug: def.slug,
      status: !previousPhaseDone
        ? "locked"
        : roundCompleted
        ? "completed"
        : "active",
      matchesCompleted: roundMatches.filter(isMatchCompleted).length,
      matchesTotal: roundMatches.length,
      description: "Eliminación directa",
    });

    previousPhaseDone = roundCompleted;
  }

  return states;
}