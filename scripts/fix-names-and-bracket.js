/**
 * Script para corregir el torneo Nacional Club Santiago Mayo 2026:
 * 1. Renombrar NARANJO Brisley → José Brisley / Naranjo
 * 2. Renombrar Gallardo Emiliano → Emilio y eliminar duplicado
 * 3. Borrar 35 partidos de eliminatoria incorrectos
 * 4. Crear 35 partidos correctos con resultados del Excel
 */

const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

const TID = '1fa8fea1-4960-4eba-bf71-49fb8539e17d';

// Player IDs from DB (verified against group matches)
const P = {
    SOBARZO:       'f2e28080-03b0-497b-9364-f1e3a47e6041',
    BAHAMONDES:    '086ed179-b045-403c-8daf-921b0e01eec5',
    TORO:          '79b98988-fbe0-416a-a372-a27d56ba46ae',
    ARENAS_B:      '47cbbfee-36d2-4b81-ade9-17a9cf1b42ea',
    CARVAJAL:      '9678748a-b077-49c4-a1a3-052d8d24b5f5',
    RUBINO:        '92642d1b-a033-40a8-b1b2-941394e548d3',
    SALINAS:       '96c8b506-397f-4ddf-9159-d0a257de5bd7',
    PENA:          '22fe6fbc-e8f7-4f47-b23f-638b370f901d',
    HADAD:         '0063ba92-a262-49fe-8af0-5746eca9e370',
    SARMIENTO:     'fd460cd1-b8bd-4066-aadf-bf57b71de5e1',
    ZUNIGA:        'e3dc8fdf-1b7c-4275-b48c-95762d71e9e2',
    COFRE:         'a73cddff-1775-4782-8f6a-f86ca2cfb375',
    TRUJILLO:      '325326aa-215e-470d-9f8e-e8bbc3b96e7b',
    CASTILLO_J:    'c6334539-05f7-43bd-9361-873b62f3a2e3',
    ALFARO_R:      '39f8c247-2699-45ac-880d-d5e707025200',
    MEJIA:         '89514f1c-7d7f-4a96-9d43-2429f2459ab8',
    OLAYA:         '5e8e237b-abb9-4e79-8057-a26bdb17acf2',
    GALLARDO:      '6919dc29-4cd0-4c23-b956-9def299132dc', // Emiliano (real: Emilio)
    GALLARDO_DUP:  'd4d5c09b-1041-4544-9512-f1a2fd30dc6b', // duplicado sin partidos
    SAENZ:         '22112d21-e4b8-4e12-bcfa-a826dcaf52ad',
    CABALLERO:     '969d78a5-2d0b-4597-8a54-bbb16f95f801',
    CHICUREL:      'cfde2e2f-d038-4674-a913-60156072b2b4',
    RUBILAR:       '74c854ad-a442-4617-aa78-0dd8c71d9708',
    RIFFO:         'cb02ec0a-a08c-4fdb-b172-b9255162d186',
    BUSTOS:        '9998e7a7-a6d7-430c-8daa-2de72066c521',
    DIAZ_J:        '458c9c63-4b02-4730-9a37-89ed4902c0b6',
    ROJAS_L:       'd6b6329c-156e-4c68-956a-20f22086e950',
    SERRANO:       '34e64cd8-f8ba-4702-82b5-c9c253e638eb',
    BERNAL:        'f9e21e53-cc75-462e-8caa-56bc42a7ef2d',
    // Barrage players
    GUERRA:        'f2ec3652-f7bb-4833-9c57-7751c28f3562',
    RODRIGUEZ_J:   '6b30acde-b26a-4a3e-8fc0-e5095ba23604',
    DIAZ_M:        'ff6d775b-08d3-4f11-a321-bca2c94e95c4',
    NARANJO:       'eecf3ebc-8f90-41ab-bac2-a41d5032c470', // NARANJO Brisley → José Brisley Naranjo
    DUARTE:        '4127b8da-206f-4227-8ffa-552bbdc26e0b',
    PONCE:         '786ede74-96ef-4db5-83cf-4832d8a91a29',
    MATUS:         '41594bb1-a036-4c30-a238-03d10b65ee8a',
    ROA:           'cc71f11f-e2f3-40e9-8b4b-790e07c11795',
};

// Helper to build a match object
function m(round, order, homeId, awayId, homeC, awayC, E, homeS, awayS, winnerId, isWO = false) {
    return {
        tournamentId: TID,
        groupId: null,
        round,
        matchOrder: order,
        homePlayerId: homeId,
        awayPlayerId: awayId,
        homeScore: homeC,
        awayScore: awayC,
        homeInnings: E,
        awayInnings: E,
        homeHighRun: homeS,
        awayHighRun: awayS,
        winnerId,
        homeTarget: 25,
        awayTarget: 25,
        isWO,
    };
}

// All 35 knockout matches from Excel (Elimina sheet)
function buildMatches() {
    return [
        // ===== ROUND 0: BARRAGE "36" (4 partidos) =====
        m(0, 1,  P.GUERRA,    P.RODRIGUEZ_J, 23, 12, 35, 4, 3, P.GUERRA),       // 36.1
        m(0, 2,  P.DIAZ_M,    P.NARANJO,     20,  8, 35, 3, 2, P.DIAZ_M),       // 36.2
        m(0, 3,  P.DUARTE,    P.PONCE,        0,  0,  0, 0, 0, P.DUARTE, true), // 36.3 WO
        m(0, 4,  P.MATUS,     P.ROA,         25, 16, 32, 3, 3, P.MATUS),        // 36.4

        // ===== ROUND 1: 16VOS (16 partidos) =====
        // Semillas 1-4 vs ganadores barrage
        m(1,  1, P.SOBARZO,   P.MATUS,       23, 23, 35, 5, 5, P.SOBARZO),      // 16.1
        m(1,  2, P.BAHAMONDES,P.DUARTE,      25, 17, 26, 6, 3, P.BAHAMONDES),   // 16.2
        m(1,  3, P.TORO,      P.DIAZ_M,      24, 18, 35, 8, 3, P.TORO),         // 16.3
        m(1,  4, P.ARENAS_B,  P.GUERRA,      25, 15, 30, 4, 5, P.ARENAS_B),     // 16.4
        // Semillas 5-16 vs semillas 17-28
        m(1,  5, P.OLAYA,     P.CARVAJAL,     0,  0,  0, 0, 0, P.OLAYA, true),  // 16.5 WO (Carvajal)
        m(1,  6, P.GALLARDO,  P.RUBINO,      16, 15, 35, 3, 3, P.GALLARDO),     // 16.6
        m(1,  7, P.SALINAS,   P.SAENZ,       25, 19, 32, 4, 5, P.SALINAS),      // 16.7
        m(1,  8, P.CABALLERO, P.PENA,        24, 21, 35, 3, 5, P.CABALLERO),    // 16.8
        m(1,  9, P.CHICUREL,  P.HADAD,       25, 20, 21, 5, 3, P.CHICUREL),     // 16.9
        m(1, 10, P.RUBILAR,   P.SARMIENTO,   25, 10, 28, 6, 3, P.RUBILAR),      // 16.10
        m(1, 11, P.RIFFO,     P.ZUNIGA,      22, 19, 35, 4, 4, P.RIFFO),        // 16.11
        m(1, 12, P.COFRE,     P.BUSTOS,      25, 17, 34, 5, 3, P.COFRE),        // 16.12
        m(1, 13, P.TRUJILLO,  P.DIAZ_J,      22, 21, 35, 4, 3, P.TRUJILLO),     // 16.13
        m(1, 14, P.ROJAS_L,   P.CASTILLO_J,  18, 17, 35, 3, 3, P.ROJAS_L),      // 16.14
        m(1, 15, P.SERRANO,   P.ALFARO_R,    25,  7, 23, 4, 4, P.SERRANO),      // 16.15
        m(1, 16, P.MEJIA,     P.BERNAL,      25, 13, 35, 5, 5, P.MEJIA),        // 16.16

        // ===== ROUND 2: 8VOS (8 partidos) =====
        m(2, 1, P.SOBARZO,   P.MEJIA,       25,  7, 15, 8, 2, P.SOBARZO),      // 8.1
        m(2, 2, P.BAHAMONDES,P.SERRANO,     25,  7, 15, 7, 2, P.BAHAMONDES),   // 8.2
        m(2, 3, P.TORO,      P.ROJAS_L,     25, 21, 35, 4, 3, P.TORO),         // 8.3
        m(2, 4, P.ARENAS_B,  P.TRUJILLO,    25, 10, 30, 3, 3, P.ARENAS_B),     // 8.4
        m(2, 5, P.OLAYA,     P.COFRE,       25, 23, 31, 4, 5, P.OLAYA),        // 8.5
        m(2, 6, P.RIFFO,     P.GALLARDO,    19, 14, 35, 3, 6, P.RIFFO),        // 8.6
        m(2, 7, P.SALINAS,   P.RUBILAR,     25, 15, 33, 4, 2, P.SALINAS),      // 8.7
        m(2, 8, P.CHICUREL,  P.CABALLERO,   25, 17, 28, 3, 2, P.CHICUREL),     // 8.8

        // ===== ROUND 3: CUARTOS (4 partidos) =====
        m(3, 1, P.SOBARZO,   P.CHICUREL,    25, 22, 29, 4, 4, P.SOBARZO),      // 4.1
        m(3, 2, P.BAHAMONDES,P.SALINAS,     25, 19, 32, 6, 4, P.BAHAMONDES),   // 4.2
        m(3, 3, P.TORO,      P.RIFFO,       25,  8, 10, 7, 2, P.TORO),         // 4.3
        m(3, 4, P.ARENAS_B,  P.OLAYA,       25,  6, 20, 6, 3, P.ARENAS_B),     // 4.4

        // ===== ROUND 4: SEMIS (2 partidos) =====
        m(4, 1, P.SOBARZO,   P.ARENAS_B,    25, 19, 17, 12, 6, P.SOBARZO),     // Semi 1
        m(4, 2, P.TORO,      P.BAHAMONDES,  25, 16, 21,  4, 2, P.TORO),        // Semi 2

        // ===== ROUND 5: FINAL (1 partido) =====
        m(5, 1, P.SOBARZO,   P.TORO,        30, 11, 23,  7, 3, P.SOBARZO),     // FINAL → CAMPEÓN: SOBARZO
    ];
}

async function main() {
    console.log('=== INICIANDO CORRECCIÓN DEL TORNEO ===\n');

    // 1. Corregir nombre NARANJO Brisley → José Brisley Naranjo
    console.log('1. Corrigiendo nombre NARANJO...');
    await prisma.playerProfile.update({
        where: { id: P.NARANJO },
        data: { firstName: 'José Brisley', lastName: 'Naranjo' }
    });
    console.log('   ✓ NARANJO Brisley → José Brisley Naranjo');

    // 2. Corregir nombre Gallardo Emiliano → Emilio
    console.log('\n2. Corrigiendo nombre Gallardo...');
    await prisma.playerProfile.update({
        where: { id: P.GALLARDO },
        data: { firstName: 'Emilio', lastName: 'Gallardo' }
    });
    console.log('   ✓ Gallardo Emiliano → Emilio Gallardo');

    // Verificar que el duplicado [d4d5c09b] no tiene partidos antes de eliminarlo
    const dupMatches = await prisma.match.count({
        where: {
            OR: [
                { homePlayerId: P.GALLARDO_DUP },
                { awayPlayerId: P.GALLARDO_DUP }
            ]
        }
    });
    const dupRankings = await prisma.ranking.count({ where: { playerId: P.GALLARDO_DUP } });
    const dupRegistrations = await prisma.tournamentRegistration.count({ where: { playerId: P.GALLARDO_DUP } });

    console.log(`   Duplicado [d4d5c09b]: ${dupMatches} partidos, ${dupRankings} rankings, ${dupRegistrations} inscripciones`);

    if (dupMatches === 0 && dupRegistrations === 0) {
        if (dupRankings > 0) {
            await prisma.ranking.deleteMany({ where: { playerId: P.GALLARDO_DUP } });
            console.log(`   ✓ ${dupRankings} rankings del duplicado eliminados`);
        }
        await prisma.playerProfile.delete({ where: { id: P.GALLARDO_DUP } });
        console.log('   ✓ Duplicado "Gallardo Emilio" [d4d5c09b] eliminado');
    } else {
        console.log('   ⚠ Duplicado tiene datos, no se eliminó. Revisión manual necesaria.');
    }

    // 3. Borrar los 35 partidos de eliminatoria incorrectos
    console.log('\n3. Borrando partidos de eliminatoria actuales...');
    const deleted = await prisma.match.deleteMany({
        where: { tournamentId: TID, groupId: null }
    });
    console.log(`   ✓ ${deleted.count} partidos eliminados`);

    // 4. Crear los 35 partidos correctos
    console.log('\n4. Creando partidos correctos...');
    const matches = buildMatches();
    let created = 0;

    for (const match of matches) {
        await prisma.match.create({ data: match });
        created++;
    }
    console.log(`   ✓ ${created} partidos creados`);

    // 5. Verificación final
    console.log('\n5. Verificando resultado...');
    const byRound = await prisma.match.groupBy({
        by: ['round'],
        where: { tournamentId: TID, groupId: null },
        _count: { round: true }
    });

    const roundNames = { 0: 'Barrage', 1: '16VOS', 2: '8VOS', 3: 'Cuartos', 4: 'Semis', 5: 'Final' };
    byRound.sort((a, b) => a.round - b.round).forEach(r => {
        console.log(`   Ronda ${r.round} (${roundNames[r.round]}): ${r._count.round} partidos`);
    });

    const finalMatch = await prisma.match.findFirst({
        where: { tournamentId: TID, groupId: null, round: 5 },
        include: {
            homePlayer: { select: { firstName: true, lastName: true } },
            awayPlayer: { select: { firstName: true, lastName: true } }
        }
    });

    if (finalMatch) {
        const camp = `${finalMatch.homePlayer?.lastName} ${finalMatch.homePlayer?.firstName}`;
        const sub = `${finalMatch.awayPlayer?.lastName} ${finalMatch.awayPlayer?.firstName}`;
        console.log(`\n   🏆 FINAL: ${camp} ${finalMatch.homeScore} - ${finalMatch.awayScore} ${sub}`);
        console.log(`   🥇 CAMPEÓN: ${camp}`);
    }

    console.log('\n=== COMPLETADO ===');
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => { console.error('ERROR:', e); prisma.$disconnect(); process.exit(1); });
