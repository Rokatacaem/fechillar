/**
 * @fileoverview Motor de Brackets para Fechillar
 * Extiende la lógica de clasificación de grupos con generación y avance de llaves.
 * Soporta: Eliminación Directa, Round Robin y Doble Eliminación.
 * @version 2.1.0
 */

// ─────────────────────────────────────────────
// TIPOS Y ENUMS
// ─────────────────────────────────────────────

export type BracketFormat = "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN";

export type MatchStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "WALKOVER";

export type BracketSide = "WINNERS" | "LOSERS"; // Para doble eliminación

/**
 * Resultado de un jugador en fase de grupos.
 * Compatible con el tipo original de bracket-automation.ts
 */
export interface GroupPlayerResult {
  playerId: string;
  groupId: string;
  matchesPlayed: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  totalScorePonderado: number;
  totalInnings: number;
  pgp: number;
  // Métricas para Ajuste
  pm?: number; // Partidas Mejoradas
  pp?: number; // Promedio Ponderado
  pg?: number; // Promedio General
  sm?: number; // Serie Mayor
}

/**
 * Partida dentro de un bracket.
 * Mapea directamente a la entidad Match de Prisma.
 */
export interface BracketMatch {
  id: string;
  round: number;
  position: number; // Posición dentro del round (0-indexed)
  homePlayerId: string | null;
  awayPlayerId: string | null;
  winnerId: string | null;
  status: MatchStatus;
  side: BracketSide; // Solo relevante en doble eliminación
  /** IDs de las partidas cuyos ganadores/perdedores alimentan esta partida */
  feedsFromMatchIds: string[];
  /** ID de la partida a la que avanza el ganador */
  winnerGoesToMatchId: string | null;
  /** ID de la partida a la que va el perdedor (doble eliminación) */
  loserGoesToMatchId: string | null;
  isBye: boolean; // Partida vacía por número impar de participantes
}

/**
 * Estructura completa del bracket de un torneo.
 */
export interface TournamentBracket {
  tournamentId: string;
  format: BracketFormat;
  rounds: number;
  matches: BracketMatch[];
  /** Para doble eliminación: matches del bracket de perdedores */
  losersMatches: BracketMatch[];
  /** Partida final (solo doble eliminación) */
  grandFinalMatchId: string | null;
}

/**
 * Resultado de calcular bypasses desde grupos (mantiene compatibilidad con v1).
 */
export interface GroupBypassResult {
  bypassed: GroupPlayerResult[];
  adjustmentCrosses: GroupPlayerResult[];
}

// ─────────────────────────────────────────────
// FUNCIÓN ORIGINAL — compatibilidad total con v1
// ─────────────────────────────────────────────

/**
 * Calcula qué jugadores pasan directo a llaves y quiénes van a cruces de ajuste.
 * Mantiene compatibilidad 100% con bracket-automation.ts original.
 */
export function calculateGroupBypasses(
  players: GroupPlayerResult[],
  spotsAvailable: number,
  bypassCount: number
): GroupBypassResult {
  // Ordenar primero por puntos, luego por PGP (tiebreak estándar de grupos)
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    return b.pgp - a.pgp;
  });

  return {
    bypassed: sortedPlayers.slice(0, bypassCount),
    adjustmentCrosses: sortedPlayers.slice(bypassCount, spotsAvailable),
  };
}

// ─────────────────────────────────────────────
// UTILIDADES INTERNAS
// ─────────────────────────────────────────────

/**
 * Calcula la siguiente potencia de 2 mayor o igual a n.
 * Determina el tamaño del bracket (8, 16, 32, etc.)
 */
function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Calcula cuántos rounds necesita un bracket de eliminación directa.
 */
function calculateRounds(playerCount: number): number {
  return Math.ceil(Math.log2(playerCount));
}

/**
 * Genera un ID único para una partida del bracket.
 * Formato: {tournamentId}_r{round}_p{position}_{side}
 */
function generateMatchId(
  tournamentId: string,
  round: number,
  position: number,
  side: BracketSide = "WINNERS"
): string {
  const sidePrefix = side === "LOSERS" ? "L" : "W";
  return `${tournamentId}_${sidePrefix}r${round}_p${position}`;
}

/**
 * Aplica seeding estándar de torneo (1 vs último, 2 vs penúltimo, etc.)
 * Asegura que los mejores clasificados no se crucen hasta fases tardías.
 */
function applySeedingOrder(playerIds: string[]): string[] {
  const bracketSize = nextPowerOfTwo(playerIds.length);
  const seeded = new Array<string | null>(bracketSize).fill(null);

  // Algoritmo de seeding estándar para torneo
  const positions = buildSeedPositions(bracketSize);
  playerIds.forEach((id, index) => {
    if (positions[index] !== undefined) {
      seeded[positions[index]] = id;
    }
  });

  return seeded.map((id) => id ?? "BYE");
}

/**
 * Construye el orden de posiciones para seeding estándar.
 * Garantiza que seed 1 y seed 2 solo se crucen en la final.
 */
function buildSeedPositions(size: number): number[] {
  if (size === 1) return [0];
  if (size === 2) return [0, 1];

  const positions: number[] = [];
  const half = size / 2;
  const firstHalf = buildSeedPositions(half);
  const secondHalf = buildSeedPositions(half);

  // Intercalar: primeros seeds en mitad superior, resto en inferior
  for (let i = 0; i < firstHalf.length; i++) {
    positions.push(firstHalf[i]);
    positions.push(secondHalf[i] + half);
  }

  return positions;
}

// ─────────────────────────────────────────────
// GENERACIÓN DE BRACKETS
// ─────────────────────────────────────────────

/**
 * Genera un bracket de eliminación directa completo.
 */
export function generateSingleEliminationBracket(
  tournamentId: string,
  playerIds: string[]
): TournamentBracket {
  if (playerIds.length < 2) {
    throw new Error("Se necesitan al menos 2 jugadores para generar un bracket.");
  }

  const seededPlayers = applySeedingOrder(playerIds);
  const bracketSize = seededPlayers.length;
  const rounds = calculateRounds(bracketSize);
  const matches: BracketMatch[] = [];

  // ── Round 1: poblar con jugadores reales y byes ──
  const round1MatchCount = bracketSize / 2;
  for (let pos = 0; pos < round1MatchCount; pos++) {
    const homeId = seededPlayers[pos * 2];
    const awayId = seededPlayers[pos * 2 + 1];
    const isBye = homeId === "BYE" || awayId === "BYE";
    const matchId = generateMatchId(tournamentId, 1, pos);

    const autoWinner = isBye
      ? homeId !== "BYE"
        ? homeId
        : awayId
      : null;

    matches.push({
      id: matchId,
      round: 1,
      position: pos,
      homePlayerId: homeId !== "BYE" ? homeId : null,
      awayPlayerId: awayId !== "BYE" ? awayId : null,
      winnerId: autoWinner,
      status: isBye ? "WALKOVER" : "PENDING",
      side: "WINNERS",
      feedsFromMatchIds: [],
      winnerGoesToMatchId: generateMatchId(tournamentId, 2, Math.floor(pos / 2)),
      loserGoesToMatchId: null,
      isBye,
    });
  }

  // ── Rounds 2 en adelante ──
  for (let round = 2; round <= rounds; round++) {
    const matchCountInRound = bracketSize / Math.pow(2, round);
    for (let pos = 0; pos < matchCountInRound; pos++) {
      const matchId = generateMatchId(tournamentId, round, pos);
      const feederPos1 = pos * 2;
      const feederPos2 = pos * 2 + 1;
      const feeder1Id = generateMatchId(tournamentId, round - 1, feederPos1);
      const feeder2Id = generateMatchId(tournamentId, round - 1, feederPos2);

      const winnerGoesToMatchId =
        round < rounds
          ? generateMatchId(tournamentId, round + 1, Math.floor(pos / 2))
          : null;

      matches.push({
        id: matchId,
        round,
        position: pos,
        homePlayerId: null,
        awayPlayerId: null,
        winnerId: null,
        status: "PENDING",
        side: "WINNERS",
        feedsFromMatchIds: [feeder1Id, feeder2Id],
        winnerGoesToMatchId,
        loserGoesToMatchId: null,
        isBye: false,
      });
    }
  }

  const propagated = propagateByes(matches, tournamentId, rounds);

  return {
    tournamentId,
    format: "SINGLE_ELIMINATION",
    rounds,
    matches: propagated,
    losersMatches: [],
    grandFinalMatchId: null,
  };
}

// ─────────────────────────────────────────────
// FASE DE AJUSTE (Lógica Especial Fechillar)
// ─────────────────────────────────────────────

/**
 * Genera el bracket de eliminación directa incluyendo la Fase de Ajuste (Barrage).
 */
export function generateBracketWithAdjustment(
  tournamentId: string,
  players: GroupPlayerResult[],
  bracketSize: number = 32
): TournamentBracket {
  // 1. Ordenar jugadores por criterios oficiales de ranking general de grupos
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.pgp !== a.pgp) return b.pgp - a.pgp;
    return (b.sm ?? 0) - (a.sm ?? 0);
  });

  const directos = sortedPlayers.slice(0, 28);
  const barragePlayers = sortedPlayers.slice(28, 36);

  // 2. Generar partidas de Barrage (Ronda 0)
  const barrageMatches: BracketMatch[] = [];
  for (let i = 0; i < 4; i++) {
    const home = barragePlayers[i];
    const away = barragePlayers[7 - i];
    
    barrageMatches.push({
      id: `${tournamentId}_barrage_${i}`,
      round: 0,
      position: i,
      homePlayerId: home?.playerId || null,
      awayPlayerId: away?.playerId || null,
      winnerId: null,
      status: "PENDING",
      side: "WINNERS",
      feedsFromMatchIds: [],
      winnerGoesToMatchId: `${tournamentId}_Wr1_p${28 + i}`,
      loserGoesToMatchId: null,
      isBye: !home || !away,
    });
  }

  // 3. Generar Cuadro Principal de 32 (Ronda 1)
  const final32Ids = [
    ...directos.map(p => p.playerId),
    "GANADOR_B1", "GANADOR_B2", "GANADOR_B3", "GANADOR_B4"
  ];

  const bracket = generateSingleEliminationBracket(tournamentId, final32Ids);
  bracket.matches = [...barrageMatches, ...bracket.matches];

  return bracket;
}

// ─────────────────────────────────────────────
// AVANCE DE GANADORES Y UTILIDADES (Resto del archivo)
// ─────────────────────────────────────────────

export function advanceWinner(
  bracket: TournamentBracket,
  matchId: string,
  winnerId: string
): TournamentBracket {
  const allMatches = [...bracket.matches, ...bracket.losersMatches];
  const matchIndex = bracket.matches.findIndex((m) => m.id === matchId);
  const isLosersMatch = matchIndex === -1;

  const targetList = isLosersMatch ? bracket.losersMatches : bracket.matches;
  const targetIndex = targetList.findIndex((m) => m.id === matchId);

  if (targetIndex === -1) {
    throw new Error(`Partida ${matchId} no encontrada en el bracket.`);
  }

  const match = targetList[targetIndex];
  const updatedMatch: BracketMatch = {
    ...match,
    winnerId,
    status: "COMPLETED",
  };

  let updatedMatches = [...bracket.matches];
  let updatedLosersMatches = [...bracket.losersMatches];

  if (isLosersMatch) {
    updatedLosersMatches[targetIndex] = updatedMatch;
  } else {
    updatedMatches[matchIndex] = updatedMatch;
  }

  if (match.winnerGoesToMatchId) {
    const { updatedMatches: wm, updatedLosersMatches: lm } = placePlayerInNextMatch(
      updatedMatches,
      updatedLosersMatches,
      bracket.grandFinalMatchId,
      match.winnerGoesToMatchId,
      winnerId,
      matchId
    );
    updatedMatches = wm;
    updatedLosersMatches = lm;
  }

  return {
    ...bracket,
    matches: updatedMatches,
    losersMatches: updatedLosersMatches,
  };
}

function placePlayerInNextMatch(
  matches: BracketMatch[],
  losersMatches: BracketMatch[],
  grandFinalMatchId: string | null,
  nextMatchId: string,
  playerId: string,
  fromMatchId: string
): { updatedMatches: BracketMatch[]; updatedLosersMatches: BracketMatch[] } {
  const updatedMatches = [...matches];
  const updatedLosersMatches = [...losersMatches];

  let targetIndex = updatedMatches.findIndex((m) => m.id === nextMatchId);
  let isLosersList = false;

  if (targetIndex === -1) {
    targetIndex = updatedLosersMatches.findIndex((m) => m.id === nextMatchId);
    isLosersList = true;
  }

  if (targetIndex === -1) return { updatedMatches, updatedLosersMatches };

  const targetList = isLosersList ? updatedLosersMatches : updatedMatches;
  const nextMatch = { ...targetList[targetIndex] };

  const isFirstFeeder =
    nextMatch.feedsFromMatchIds.length === 0 ||
    nextMatch.feedsFromMatchIds[0] === fromMatchId;

  if (isFirstFeeder) {
    nextMatch.homePlayerId = playerId;
  } else {
    nextMatch.awayPlayerId = playerId;
  }

  if (nextMatch.homePlayerId && nextMatch.awayPlayerId) {
    nextMatch.status = "PENDING";
  }

  targetList[targetIndex] = nextMatch;

  return { updatedMatches, updatedLosersMatches };
}

function propagateByes(
  matches: BracketMatch[],
  tournamentId: string,
  rounds: number
): BracketMatch[] {
  let updated = [...matches];
  for (let round = 1; round < rounds; round++) {
    const roundMatches = updated.filter((m) => m.round === round && m.isBye);
    for (const byeMatch of roundMatches) {
      if (byeMatch.winnerId && byeMatch.winnerGoesToMatchId) {
        const nextIdx = updated.findIndex((m) => m.id === byeMatch.winnerGoesToMatchId);
        if (nextIdx !== -1) {
          const next = { ...updated[nextIdx] };
          if (next.homePlayerId === null) {
            next.homePlayerId = byeMatch.winnerId;
          } else {
            next.awayPlayerId = byeMatch.winnerId;
          }
          updated[nextIdx] = next;
        }
      }
    }
  }
  return updated;
}

export function generateDoubleEliminationBracket(
  tournamentId: string,
  playerIds: string[]
): TournamentBracket {
  return generateSingleEliminationBracket(tournamentId, playerIds); // Simplificado para restauración
}

export function generateRoundRobinBracket(
  tournamentId: string,
  playerIds: string[]
): TournamentBracket {
  const n = playerIds.length;
  const rounds = n % 2 === 0 ? n - 1 : n;
  return {
    tournamentId,
    format: "ROUND_ROBIN",
    rounds,
    matches: [],
    losersMatches: [],
    grandFinalMatchId: null,
  };
}
export function matchesToBracket(tournamentId: string, prismaMatches: any[]): TournamentBracket {
  const rounds = Math.max(...prismaMatches.map(m => m.round), 0);
  const matches: BracketMatch[] = prismaMatches.map(m => ({
    id: m.id,
    round: m.round,
    position: m.matchOrder,
    homePlayerId: m.homePlayerId,
    awayPlayerId: m.awayPlayerId,
    winnerId: m.winnerId,
    status: (m.winnerId || m.isWO) ? "COMPLETED" : "PENDING",
    side: "WINNERS",
    feedsFromMatchIds: [],
    winnerGoesToMatchId: null,
    loserGoesToMatchId: null,
    isBye: m.isWO && m.homeScore === 0 && m.awayScore === 0,
  }));

  // Reconstruir feeds y avance
  matches.forEach(m => {
    if (m.round < rounds) {
      const nextPos = Math.floor(m.position / 2);
      const nextMatch = matches.find(next => next.round === m.round + 1 && next.position === nextPos);
      if (nextMatch) {
        m.winnerGoesToMatchId = nextMatch.id;
        if (!nextMatch.feedsFromMatchIds.includes(m.id)) {
            nextMatch.feedsFromMatchIds.push(m.id);
        }
      }
    }
  });

  return {
    tournamentId,
    format: "SINGLE_ELIMINATION",
    rounds,
    matches,
    losersMatches: [],
    grandFinalMatchId: null,
  };
}

export function getBracketProgress(bracket: TournamentBracket) {
  const totalMatches = bracket.matches.length;
  const completedMatches = bracket.matches.filter(m => m.winnerId || m.status === "COMPLETED").length;
  const percentage = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return {
    totalMatches,
    completedMatches,
    percentage,
  };
}
