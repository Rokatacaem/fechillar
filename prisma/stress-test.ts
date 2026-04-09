import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("🔥 Iniciando STRESS TEST: Gran Abierto AutoLink 32");

    // 1. OBTENER O GENERAR 32 JUGADORES
    console.log("⏳ Preparando 32 Jugadores Élite...");
    const basePlayers = await prisma.playerProfile.findMany({
        take: 32,
        include: { user: true }
    });

    const needed = 32 - basePlayers.length;
    let poolOfPlayers = [...basePlayers];

    if (needed > 0) {
        console.log(`Faltan ${needed} jugadores para llegar a 32. Generando autómatas...`);
        const clubPropool = await prisma.club.findUnique({ where: { slug: 'pro-pool' } });
        if (!clubPropool) throw new Error("No existe club Pro Pool");

        for (let i = 0; i < needed; i++) {
            const user = await prisma.user.create({
                data: {
                    email: `stress${i}@autolink.test`,
                    name: `AutoLink Challenger ${i+1}`,
                    role: 'PLAYER',
                }
            });
            const player = await prisma.playerProfile.create({
                data: {
                    userId: user.id,
                    tenantId: clubPropool.id,
                    rut: `99.999.${100 + i}-0`,
                },
                include: { user: true }
            });
            
            // Asignarles puntos inventados para que haya un ranking base
            await prisma.ranking.create({
                data: {
                    playerId: player.id,
                    discipline: "POOL",
                    category: "HONOR",
                    points: Math.floor(Math.random() * 500) + 100
                }
            });

            poolOfPlayers.push(player);
        }
    }

    // 2. CREACIÓN DEL TORNEO 
    console.log("🏆 Levantando Infraestructura del 'Gran Abierto AutoLink 32'...");
    const clubSede = await prisma.club.findUnique({ where: { slug: 'pro-pool' } });
    if (!clubSede) throw new Error("No existe club Pro Pool");

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@fechillar.cl' } });
    
    const tournament = await prisma.tournament.create({
        data: {
            name: "Gran Abierto AutoLink 32",
            description: "Stress Test Oficial de Rendimiento - Cuadro 32",
            discipline: "POOL",
            modality: "NINE_BALL",
            category: "HONOR",
            status: "IN_PROGRESS", // Ya en progreso
            scope: "NATIONAL",
            tenantId: clubSede.id,
            startDate: new Date(),
            createdById: adminUser?.id
        }
    });

    // 3. INSCRIPCIÓN DE LOS 32 JUGADORES
    console.log("📝 Inscribiendo y Forzando Pagos Aprobados...");
    
    // Traer puntos de todos
    const allRankings = await prisma.ranking.findMany({
        where: { discipline: "POOL", category: "HONOR" }
    });

    const registrationsToInsert = poolOfPlayers.map(p => {
        const rk = allRankings.find(r => r.playerId === p.id);
        const pts = rk ? rk.points : 0;
        return {
            tournamentId: tournament.id,
            playerId: p.id,
            registeredPoints: pts,
            status: "APPROVED" as const,
            paid: true,
            paymentStatus: "PAID",
            amountPaid: 15000,
            paymentRef: `STRESS-PAY-${p.id.substring(0,6)}`,
            paidAt: new Date()
        }
    });

    await prisma.tournamentRegistration.createMany({
        data: registrationsToInsert
    });

    // 4. GENERACIÓN DE BRACKETS (32 Jugadores = 16 Partidos, Siembra Protegida 1 vs 32)
    console.log("⚙️  Ejecutando Motor de Matchmaking (Round 1)...");
    const inscriptions = await prisma.tournamentRegistration.findMany({
        where: { tournamentId: tournament.id, status: "APPROVED", paymentStatus: "PAID" },
        orderBy: { registeredPoints: 'desc' }
    });

    const bracketSize = 32;
    const matchesToInsert = [];
    
    for (let i = 0; i < bracketSize / 2; i++) {
        const homePlayer = inscriptions[i];
        const awayPlayer = inscriptions[bracketSize - 1 - i]; // 1 vs 32, 2 vs 31, etc.

        matchesToInsert.push({
            tournamentId: tournament.id,
            round: 1,
            matchOrder: i + 1,
            tableNumber: `Mesa ${i % 4 + 1}`, // Repartir en 4 mesas imaginarias
            homePlayerId: homePlayer.playerId,
            awayPlayerId: awayPlayer ? awayPlayer.playerId : null,
            isWO: !awayPlayer,
        });
    }

    await prisma.match.createMany({ data: matchesToInsert });

    // Auditar Creación Masiva
    await prisma.auditLog.create({
        data: {
            action: "BRACKETS_GENERATED",
            targetId: tournament.id,
            userId: adminUser?.id || "",
            details: "Se generaron los cuadros iniciales (Round 1) para 32 jugadores (Stress Test)."
        }
    });

    // 5. SIMULACIÓN DE RESULTADOS RONDA 1
    console.log("⚔️  Simulando Victorias de Favoritos (Ronda 1)...");
    const r1Matches = await prisma.match.findMany({
        where: { tournamentId: tournament.id, round: 1 },
        orderBy: { matchOrder: 'asc' }
    });

    for (const m of r1Matches) {
        if (!m.awayPlayerId || m.isWO) continue; // Si es ByE simulado (aunque son 32 exactos, no habrán)

        // El HomePlayer siempre es el Favorito en este cruce (porque cruzamos 1 vs 32)
        await prisma.match.update({
            where: { id: m.id },
            data: {
                homeScore: 15,
                awayScore: Math.floor(Math.random() * 10), // Random loser score (0-9)
                winnerId: m.homePlayerId
            }
        });

        // 6. PROPAGAR A RONDA 2
        // Cálculo algebraico del árbol binario
        const nextRoundOrder = Math.ceil(m.matchOrder / 2);
        const position = m.matchOrder % 2 !== 0 ? 'home' : 'away';

        let nextMatch = await prisma.match.findFirst({
            where: { tournamentId: tournament.id, round: 2, matchOrder: nextRoundOrder }
        });

        if (!nextMatch) {
            nextMatch = await prisma.match.create({
                data: {
                    tournamentId: tournament.id,
                    round: 2,
                    matchOrder: nextRoundOrder,
                    tableNumber: `Mesa ${nextRoundOrder}`,
                    homePlayerId: position === 'home' ? m.homePlayerId : "TBD",
                    awayPlayerId: position === 'away' ? m.homePlayerId : null, 
                }
            });
        } else {
            await prisma.match.update({
                where: { id: nextMatch.id },
                data: position === 'home' ? { homePlayerId: m.homePlayerId } : { awayPlayerId: m.homePlayerId }
            });
        }
    }

    console.log("\n=================================");
    console.log("✅ STRESS TEST COMPLETADO CON ÉXITO");
    console.log("=================================");
    console.log("El cuadro de 32 fue generado. La Ronda 1 fue juzgada, y la Ronda 2 (16avos) está lista.");
    console.log(`\nURL Pública para visualizar el Showroom del torneo:`);
    console.log(`👉 http://localhost:3000/clubes/pro-pool\n`);
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
