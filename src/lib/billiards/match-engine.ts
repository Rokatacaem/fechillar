/**
 * @fileoverview Motor de Validación de Fin de Juego - FECHILLAR
 * Este motor centraliza la lógica de victoria basada en hándicap y reglas profesionales
 * como la "Contra Salida" (Equalizing Inning).
 */

export interface MatchWinContext {
  homeScore: number;
  awayScore: number;
  homeTarget: number;
  awayTarget: number;
  homeInnings: number;
  awayInnings: number;
  hasEqualizingInning: boolean; // Si es FALSE, el partido termina de inmediato al llegar al target.
  inningLimit?: number;
}

export interface MatchWinnerResult {
  isFinished: boolean;
  winner: 'HOME' | 'AWAY' | 'DRAW' | null;
  reason: string;
}

/**
 * Determina si un partido ha finalizado y quién es el ganador.
 */
export function evaluateMatchWinner(ctx: MatchWinContext): MatchWinnerResult {
  const { 
    homeScore, awayScore, 
    homeTarget, awayTarget, 
    homeInnings, awayInnings, 
    hasEqualizingInning, 
    inningLimit 
  } = ctx;

  // 1. Victoria Directa (Target Alcanzado)
  
  // Jugador CASA (Home) llega al target
  if (homeScore >= homeTarget) {
    // Si NO hay contrasalida, gana de inmediato.
    if (!hasEqualizingInning) {
      return { isFinished: true, winner: 'HOME', reason: 'Target alcanzado (Sin Contrasalida)' };
    }
    // Si HAY contrasalida, el visitante debe terminar su entrada si está una entrada por debajo.
    if (homeInnings === awayInnings) {
      // Ambos terminaron sus entradas y Home sigue arriba o igualó.
      // Pero si Home llegó al target y Away no, Home gana.
      if (awayScore < awayTarget) {
        return { isFinished: true, winner: 'HOME', reason: 'Target alcanzado (Contrasalida completada)' };
      }
    }
  }

  // Jugador VISITANTE (Away) llega al target
  if (awayScore >= awayTarget) {
    // Si llega al target, siempre gana o empata el partido (si Home ya estaba en target).
    if (homeScore >= homeTarget) {
      // En billar profesional con contrasalida, si ambos llegan al target hay desempate (Shootout), 
      // pero aquí devolvemos DRAW para que la lógica superior decida.
      return { isFinished: true, winner: 'DRAW', reason: 'Ambos alcanzaron target (Empate Técnico)' };
    }
    return { isFinished: true, winner: 'AWAY', reason: 'Target alcanzado' };
  }

  // 2. Límite de Entradas (Inning Limit)
  if (inningLimit && (homeInnings >= inningLimit || awayInnings >= inningLimit)) {
    // Solo cerramos si ambos han completado el límite de entradas
    if (homeInnings === awayInnings) {
      const homePct = homeScore / homeTarget;
      const awayPct = awayScore / awayTarget;

      if (homePct > awayPct) return { isFinished: true, winner: 'HOME', reason: 'Límite de entradas (% cumplimiento superior)' };
      if (awayPct > homePct) return { isFinished: true, winner: 'AWAY', reason: 'Límite de entradas (% cumplimiento superior)' };
      return { isFinished: true, winner: 'DRAW', reason: 'Límite de entradas (Empate en %)' };
    }
  }

  return { isFinished: false, winner: null, reason: 'Partido en progreso' };
}

/**
 * Calcula el PGP (Promedio General Ponderado) basado en hándicap.
 * Fórmula: (Puntaje / Entradas) * (100 / Objetivo)
 * O simplificado: Cumplimiento / Entradas
 */
export function calculateHandicapPGP(score: number, target: number, innings: number): number {
  if (innings === 0) return 0;
  const rawAverage = score / innings;
  // El PGP en modo hándicap suele normalizarse
  return parseFloat(rawAverage.toFixed(3));
}

/**
 * Calcula el Porcentaje de Cumplimiento.
 */
export function calculateCompletionPct(score: number, target: number): number {
  if (target === 0) return 0;
  return (score / target) * 100;
}
