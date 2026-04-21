import { WEIGHTING_TABLE } from './constants';

export interface MatchData {
  homeScore: number;
  awayScore: number;
  homeTarget: number;
  awayTarget: number;
  homeInnings: number;
  awayInnings: number;
  homeHighRun: number;
  awayHighRun: number;
  limitInnings?: number;
  limitTimeMinutes?: number;
}

export interface TieBreakResult {
  winner: 'HOME' | 'AWAY' | 'DRAW';
  reason: string;
  homePonderado: number;
  awayPonderado: number;
  homeEficiencia: number;
  awayEficiencia: number;
}

export function determine3BWinner(match: MatchData): TieBreakResult {
  const homeTargetHit = match.homeScore >= match.homeTarget;
  const awayTargetHit = match.awayScore >= match.awayTarget;
  
  // Eficiencia = Carambolas / Meta
  const homeEficiencia = match.homeScore / match.homeTarget;
  const awayEficiencia = match.awayScore / match.awayTarget;
  
  // Ponderado = Carambolas * Factor de Tabla
  const homeFactor = WEIGHTING_TABLE[match.homeTarget] || 1.0;
  const awayFactor = WEIGHTING_TABLE[match.awayTarget] || 1.0;
  const homePonderado = match.homeScore * homeFactor;
  const awayPonderado = match.awayScore * awayFactor;

  // Ambos llegan y tienen contrasalida: Empate
  if (homeTargetHit && awayTargetHit) {
      return { 
          winner: 'DRAW', 
          reason: 'Ambos jugadores alcanzaron la meta (Contrasalida)', 
          homePonderado, awayPonderado, homeEficiencia, awayEficiencia
      };
  }
  
  // Solo uno llega a la meta
  if (homeTargetHit) return { winner: 'HOME', reason: 'Meta alcanzada', homePonderado, awayPonderado, homeEficiencia, awayEficiencia };
  if (awayTargetHit) return { winner: 'AWAY', reason: 'Meta alcanzada', homePonderado, awayPonderado, homeEficiencia, awayEficiencia };
  
  // Si partido terminó por límite pero ninguno llegó a su meta
  if (homeEficiencia > awayEficiencia) {
      return { winner: 'HOME', reason: 'Mejor eficiencia (Carambolas/Meta)', homePonderado, awayPonderado, homeEficiencia, awayEficiencia };
  } else if (awayEficiencia > homeEficiencia) {
      return { winner: 'AWAY', reason: 'Mejor eficiencia (Carambolas/Meta)', homePonderado, awayPonderado, homeEficiencia, awayEficiencia };
  } else {
      // Empate en eficiencia, evaluar puntaje ponderado
      if (homePonderado > awayPonderado) {
          return { winner: 'HOME', reason: 'Eficiencia igualada, mejor puntaje ponderado', homePonderado, awayPonderado, homeEficiencia, awayEficiencia };
      } else if (awayPonderado > homePonderado) {
          return { winner: 'AWAY', reason: 'Eficiencia igualada, mejor puntaje ponderado', homePonderado, awayPonderado, homeEficiencia, awayEficiencia };
      }
      return { winner: 'DRAW', reason: 'Empate total en eficiencia y ponderación', homePonderado, awayPonderado, homeEficiencia, awayEficiencia };
  }
}
