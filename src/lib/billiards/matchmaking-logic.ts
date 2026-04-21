/**
 * Lógica de Generación de Enfrentamientos para 3 Bandas
 */

export interface MatchPlaceholder {
    round: number;
    matchOrder: number;
    homeIndex: number | null; // Index en la lista de jugadores del grupo
    awayIndex: number | null;
    label?: string;
}

/**
 * Round Robin para 3 Jugadores (Formato Oficial)
 * Partida 1: 1 vs 2
 * Partida 2: Perdedor 1 vs 3
 * Partida 3: Ganador 1 vs 3
 */
export function generateRR3Matches(): MatchPlaceholder[] {
    return [
        { round: 1, matchOrder: 1, homeIndex: 0, awayIndex: 1, label: "1 vs 2" },
        { round: 2, matchOrder: 2, homeIndex: null, awayIndex: 2, label: "Perdedor vs 3" },
        { round: 3, matchOrder: 3, homeIndex: null, awayIndex: 2, label: "Ganador vs 3" }
    ];
}

/**
 * Doble Eliminación para 4 Jugadores (GSL / Dual Tournament)
 * R1: 1v4, 2v3
 * R2: Ganadores (Clasifica 1), Perdedores
 * R3: Perdedor Ganadores vs Ganador Perdedores (Clasifica 2)
 */
export function generateDE4Matches(): MatchPlaceholder[] {
    return [
        // Ronda 1
        { round: 1, matchOrder: 1, homeIndex: 0, awayIndex: 3, label: "1 vs 4" },
        { round: 1, matchOrder: 2, homeIndex: 1, awayIndex: 2, label: "2 vs 3" },
        // Ronda 2
        { round: 2, matchOrder: 3, homeIndex: null, awayIndex: null, label: "Ganadores (G1 v G2)" },
        { round: 2, matchOrder: 4, homeIndex: null, awayIndex: null, label: "Perdedores (P1 v P2)" },
        // Ronda 3 (Decider)
        { round: 3, matchOrder: 5, homeIndex: null, awayIndex: null, label: "Decider" }
    ];
}
