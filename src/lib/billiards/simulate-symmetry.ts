import { WEIGHTING_TABLE } from './constants';
import { calculateGroupBypasses, GroupPlayerResult } from './bracket-automation';

function runSymmetry39Simulation() {
    console.log("Iniciando Operación Simetría 39...\n");

    const players: GroupPlayerResult[] = [];
    const NUM_GROUPS = 13;
    const TOTAL_PLAYERS = 39;
    const MATCHES_PER_PLAYER = 2; // Grupo de 3 = juegan 2 partidos cada uno

    // Generar 39 jugadores con handicaps simulados (20 a 28)
    for (let i = 1; i <= TOTAL_PLAYERS; i++) {
        // Asignamos un target basado en el seed (los primeros seeds tienen target más alto)
        let target = 28 - Math.floor(i / 4);
        if (target < 20) target = 20;

        // Simulamos desempeño: los líderes ganan ambos, resto gana 1 o pierde
        const won = i <= 13 ? 2 : (i <= 26 ? 1 : 0);
        const points = won * 3; // 3 pts por victoria
        
        // Simulación de Carambolas y Entradas
        const score1 = won >= 1 ? target : Math.floor(target * 0.8);
        const score2 = won === 2 ? target : Math.floor(target * 0.7);
        const totalCarambolas = score1 + score2;
        
        const innings1 = 20 + Math.floor(Math.random() * 15); // max 35 innings
        const innings2 = 20 + Math.floor(Math.random() * 15);
        const totalInnings = innings1 + innings2;
        
        const factor = WEIGHTING_TABLE[target] || 1.0;
        const totalScorePonderado = totalCarambolas * factor;
        const pgp = totalScorePonderado / totalInnings;

        // Distribución Serpentina para el GroupId (Seed 1 = Grp A, Seed 26 = Grp A)
        const ascGroupIdx = (i - 1) % NUM_GROUPS;
        const descGroupIdx = NUM_GROUPS - 1 - ((i - 1) % NUM_GROUPS);
        // Lógica simplificada de grupo sólo para mock mapping:
        const groupLetter = String.fromCharCode(65 + ascGroupIdx);

        players.push({
            playerId: `Jugador_Seed_${i}`,
            groupId: `Grupo_${groupLetter}`,
            matchesPlayed: MATCHES_PER_PLAYER,
            won,
            drawn: 0,
            lost: MATCHES_PER_PLAYER - won,
            points,
            totalScorePonderado,
            totalInnings,
            pgp
        });
    }

    // 26 clasificados (los primeros 2 de cada grupo)
    // Ordenamos por puntos (todos con 6 pts van primero, luego los de 3 pts), y ahí entra el bypass
    const qualifiedPlayers = [...players].sort((a, b) => b.points - a.points || b.pgp - a.pgp).slice(0, 26);

    const { bypassed, adjustmentCrosses } = calculateGroupBypasses(qualifiedPlayers, 20, 6);

    console.log("🏆 LOS 6 INTOCABLES (BYES DIRECTOS A LLAVE FINAL)");
    console.log("--------------------------------------------------");
    bypassed.forEach((p, idx) => {
        console.log(`Rank ${idx + 1}: ${p.playerId} | ${p.groupId}`);
        console.log(`    PGP: ${p.pgp.toFixed(3)} (Ponderado: ${p.totalScorePonderado.toFixed(2)} / Entradas: ${p.totalInnings})`);
    });

    console.log("\n⚔️ CRUCES DE RONDA DE AJUSTE (20 JUGADORES)");
    console.log("--------------------------------------------------");
    // Rank 7 vs Rank 26 (Index 0 vs Index 19)
    for (let i = 0; i < adjustmentCrosses.length / 2; i++) {
        const p1 = adjustmentCrosses[i];
        const p2 = adjustmentCrosses[adjustmentCrosses.length - 1 - i];
        
        console.log(`Cruce ${i+1}: [Rank ${7 + i}] ${p1.playerId} vs [Rank ${26 - i}] ${p2.playerId}`);
    }
}

// export para testing
export { runSymmetry39Simulation };
