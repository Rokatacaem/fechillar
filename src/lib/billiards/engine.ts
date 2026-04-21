/**
 * @fileoverview Motor de Reglas Deportivas para Fechillar
 * Soporta Carambola 3 Bandas, Pool 8/9/10 y Snooker.
 * @version 2.0.0 - Akapoolco Layer
 */

// ─────────────────────────────────────────────
// ENUMS Y CONSTANTES
// ─────────────────────────────────────────────

export enum Discipline {
    THREE_CUSHION = "THREE_CUSHION",
    POOL_8 = "POOL_8",
    POOL_9 = "POOL_9",
    POOL_10 = "POOL_10",
    SNOOKER = "SNOOKER"
}

export enum MatchEventType {
    SCORE = "SCORE",
    MISS = "MISS",
    FOUL = "FOUL",
    RACK_WIN = "RACK_WIN",
    EXTENSION = "EXTENSION",
    TIMEOUT = "TIMEOUT"
}

// ─────────────────────────────────────────────
// INTERFACES CENTRALES
// ─────────────────────────────────────────────

/**
 * Define las reglas variables entre disciplinas deportivas.
 */
export interface MatchRules {
    discipline: Discipline;
    /** Segundos por turno de tiro. 40s en 3C, 30s en Pool. */
    maxTimePerShot: number;
    /** Extensiones de tiempo permitidas por partido. */
    extensionsPerMatch: number;
    /** Puntos/Carambolas para ganar (modo puntaje). Null si aplica 'racks'. */
    pointsToWin: number | null;
    /** Racks totales para ganar (modo best-of). Null si aplica 'puntaje'. */
    racksToWin: number | null;
    /** Si el reglamento incluye penalización por faltas. */
    hasFouls: boolean;
    /** Faltas consecutivas antes de pérdida automática de rack. 0 = sin límite. */
    maxConsecutiveFouls: number;
    /** Si hay inning limit fijo. */
    inningLimit: number | null;
}

/**
 * Estado completo de un partido activo en memoria.
 */
export interface MatchState {
    matchId: string;
    discipline: Discipline;
    rules: MatchRules;
    homeScore: number;
    awayScore: number;
    homeRacks: number;
    awayRacks: number;
    homeConsecutiveFouls: number;
    awayConsecutiveFouls: number;
    innings: number;
    currentRun: number;
    /** "HOME" | "AWAY" — Quién tiene el turno de saque (Break). */
    breakTurn: "HOME" | "AWAY";
    activeTurn: "HOME" | "AWAY";
    isFinished: boolean;
    winnerId: string | null;
    events: MatchEvent[];
    lastSyncAt: number; // timestamp
}

export interface MatchEvent {
    type: MatchEventType;
    actor: "HOME" | "AWAY";
    value?: number;
    timestamp: number;
}

// ─────────────────────────────────────────────
// REGLAS PREDEFINIDAS POR DISCIPLINA
// ─────────────────────────────────────────────

export const DISCIPLINE_RULES: Record<Discipline, MatchRules> = {
    [Discipline.THREE_CUSHION]: {
        discipline: Discipline.THREE_CUSHION,
        maxTimePerShot: 40,
        extensionsPerMatch: 2,
        pointsToWin: null,      // Se define dinámicamente por hándicap
        racksToWin: null,
        hasFouls: false,
        maxConsecutiveFouls: 0,
        inningLimit: null,
    },
    [Discipline.POOL_8]: {
        discipline: Discipline.POOL_8,
        maxTimePerShot: 30,
        extensionsPerMatch: 0,
        pointsToWin: null,
        racksToWin: 5,          // Best of 9 (primero en ganar 5)
        hasFouls: true,
        maxConsecutiveFouls: 3, // 3 faltas consecutivas = pérdida del rack
        inningLimit: null,
    },
    [Discipline.POOL_9]: {
        discipline: Discipline.POOL_9,
        maxTimePerShot: 30,
        extensionsPerMatch: 0,
        pointsToWin: null,
        racksToWin: 7,          // Best of 13
        hasFouls: true,
        maxConsecutiveFouls: 3,
        inningLimit: null,
    },
    [Discipline.POOL_10]: {
        discipline: Discipline.POOL_10,
        maxTimePerShot: 30,
        extensionsPerMatch: 0,
        pointsToWin: null,
        racksToWin: 7,
        hasFouls: true,
        maxConsecutiveFouls: 3,
        inningLimit: null,
    },
    [Discipline.SNOOKER]: {
        discipline: Discipline.SNOOKER,
        maxTimePerShot: 60,
        extensionsPerMatch: 0,
        pointsToWin: 147,       // Max break teórico
        racksToWin: null,
        hasFouls: true,
        maxConsecutiveFouls: 0,
        inningLimit: null,
    }
};

// ─────────────────────────────────────────────
// MOTOR DE EVENTOS
// ─────────────────────────────────────────────

/**
 * Inicializa el estado de un partido nuevo.
 */
export function initMatch(matchId: string, discipline: Discipline, overrideRules?: Partial<MatchRules>): MatchState {
    const baseRules = DISCIPLINE_RULES[discipline];
    const rules: MatchRules = { ...baseRules, ...overrideRules };

    return {
        matchId,
        discipline,
        rules,
        homeScore: 0,
        awayScore: 0,
        homeRacks: 0,
        awayRacks: 0,
        homeConsecutiveFouls: 0,
        awayConsecutiveFouls: 0,
        innings: 1,
        currentRun: 0,
        breakTurn: "HOME",
        activeTurn: "HOME",
        isFinished: false,
        winnerId: null,
        events: [],
        lastSyncAt: Date.now()
    };
}

/**
 * Procesa un evento deportivo e inmuta el estado.
 * Puro (no muta in-place, retorna nuevo estado).
 */
export function applyEvent(state: MatchState, event: MatchEvent): MatchState {
    let next = { ...state, events: [...state.events, event] };

    if (event.type === MatchEventType.SCORE) {
        if (event.actor === "HOME") {
            next.homeScore += (event.value ?? 1);
            next.homeConsecutiveFouls = 0;
            next.currentRun += 1;
        } else {
            next.awayScore += (event.value ?? 1);
            next.awayConsecutiveFouls = 0;
            next.currentRun += 1;
        }
    }

    if (event.type === MatchEventType.MISS) {
        next.currentRun = 0;
        next.activeTurn = event.actor === "HOME" ? "AWAY" : "HOME";
    }

    if (event.type === MatchEventType.FOUL && next.rules.hasFouls) {
        if (event.actor === "HOME") {
            next.homeConsecutiveFouls += 1;
            if (next.rules.maxConsecutiveFouls > 0 && next.homeConsecutiveFouls >= next.rules.maxConsecutiveFouls) {
                next = applyRackWin(next, "AWAY"); // 3 fouls = rack perdido
            }
        } else {
            next.awayConsecutiveFouls += 1;
            if (next.rules.maxConsecutiveFouls > 0 && next.awayConsecutiveFouls >= next.rules.maxConsecutiveFouls) {
                next = applyRackWin(next, "HOME");
            }
        }
        next.currentRun = 0;
        next.activeTurn = event.actor === "HOME" ? "AWAY" : "HOME";
    }

    if (event.type === MatchEventType.RACK_WIN) {
        next = applyRackWin(next, event.actor);
    }

    // Verificación de victoria general
    next = checkWinCondition(next);
    next.lastSyncAt = Date.now();
    return next;
}

/**
 * Aplica la ganancia de un rack para el actor y reinicia el estado del rack.
 */
function applyRackWin(state: MatchState, winner: "HOME" | "AWAY"): MatchState {
    const next = { ...state };
    if (winner === "HOME") next.homeRacks += 1;
    else next.awayRacks += 1;

    // Reset rack
    next.homeScore = 0;
    next.awayScore = 0;
    next.homeConsecutiveFouls = 0;
    next.awayConsecutiveFouls = 0;
    next.currentRun = 0;
    // El "break" rota entre racks
    next.breakTurn = next.breakTurn === "HOME" ? "AWAY" : "HOME";
    next.activeTurn = next.breakTurn;
    return next;
}

/**
 * Verifica si el partido debe terminar según las reglas.
 */
function checkWinCondition(state: MatchState): MatchState {
    const next = { ...state };
    const { rules } = next;

    if (rules.racksToWin) {
        if (next.homeRacks >= rules.racksToWin) { next.isFinished = true; next.winnerId = "HOME"; }
        if (next.awayRacks >= rules.racksToWin) { next.isFinished = true; next.winnerId = "AWAY"; }
    }

    if (rules.pointsToWin) {
        if (next.homeScore >= rules.pointsToWin) { next.isFinished = true; next.winnerId = "HOME"; }
        if (next.awayScore >= rules.pointsToWin) { next.isFinished = true; next.winnerId = "AWAY"; }
    }

    return next;
}

// ─────────────────────────────────────────────
// PERSISTENCIA EN LOCALSTORAGE (Modo Nómada)
// ─────────────────────────────────────────────

const STORAGE_PREFIX = "fechillar_match_";

/**
 * Persiste el estado del partido en localStorage.
 * Con fallback graceful si el entorno no es browser.
 */
export function saveMatchState(state: MatchState): void {
    if (typeof window === "undefined") return;
    try {
        const key = `${STORAGE_PREFIX}${state.matchId}`;
        localStorage.setItem(key, JSON.stringify(state));
    } catch {
        console.warn("[Engine] LocalStorage no disponible. Estado volátil.");
    }
}

/**
 * Recupera el estado del partido desde localStorage.
 * Usado en el reinicio del tótem para retomar el rack exacto.
 */
export function restoreMatchState(matchId: string): MatchState | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${matchId}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as MatchState;
        console.info(`[Engine] Estado de partido ${matchId} recuperado desde cache. Rack: H${parsed.homeRacks}-A${parsed.awayRacks}`);
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Limpia el estado del partido (al cerrarse el acta).
 */
export function clearMatchState(matchId: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${STORAGE_PREFIX}${matchId}`);
}
