import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Iniciando poblamiento de base de datos FECHILLAR 2026...");

    // ----------------------------------------------------
    // 1. CLUBES BASE
    // ----------------------------------------------------
    const federation = await prisma.club.upsert({
        where: { slug: 'federacion' },
        update: {},
        create: {
            name: 'Federación Chilena de Billar',
            slug: 'federacion',
            primaryColor: '#0f172a',
            secondaryColor: '#10b981',
            isValidated: true,
        },
    });

    const clubsData = [
        { name: 'Pro Pool', slug: 'pro-pool', color1: '#1e293b', color2: '#f59e0b' },
        { name: 'Club de Billar Santiago', slug: 'santiago', color1: '#1e293b', color2: '#3b82f6' },
        { name: 'Club de Billar Ovalle', slug: 'ovalle', color1: '#1e293b', color2: '#ef4444' },
        { name: 'Club Patagonia', slug: 'patagonia', color1: '#0f172a', color2: '#06b6d4' },
        { name: 'Club La Calera', slug: 'la-calera', color1: '#171717', color2: '#8b5cf6' },
        { name: 'Club San Miguel', slug: 'san-miguel', color1: '#1c1917', color2: '#f97316' },
    ];

    const createdClubs: any = {};
    for (const data of clubsData) {
        createdClubs[data.slug] = await prisma.club.upsert({
            where: { slug: data.slug },
            update: {},
            create: {
                name: data.name,
                slug: data.slug,
                primaryColor: data.color1,
                secondaryColor: data.color2,
                isValidated: true,
            }
        });
    }

    // ----------------------------------------------------
    // 2. USUARIOS Y JUGADORES ÉLITE (Top Ranking Buchacas)
    // ----------------------------------------------------
    const playersData = [
        { email: 'fgallegos@propool.cl', name: 'Felipe Gallegos', rut: '15.111.222-3', clubSlug: 'pro-pool', slug: 'felipe-gallegos' },
        { email: 'acarvajal@santiago.cl', name: 'Alejandro Carvajal', rut: '16.222.333-4', clubSlug: 'santiago', slug: 'alejandro-carvajal' },
        { email: 'elobo@ovalle.cl', name: 'Enrique Lobo', rut: '14.333.444-5', clubSlug: 'ovalle', slug: 'enrique-lobo' },
        { email: 'jmartinez@patagonia.cl', name: 'Javier Martínez', rut: '17.444.555-6', clubSlug: 'patagonia', slug: 'javier-martinez' },
        { email: 'psuarez@sanmiguel.cl', name: 'Pablo Suárez', rut: '18.555.666-7', clubSlug: 'san-miguel', slug: 'pablo-suarez' },
    ];

    for (const p of playersData) {
        const user = await prisma.user.upsert({
            where: { email: p.email },
            update: {},
            create: {
                email: p.email,
                name: p.name,
                role: 'PLAYER',
                passwordHash: 'password123', // Hardcoded auth for testing
            }
        });

        await prisma.playerProfile.upsert({
            where: { userId: user.id },
            update: { tenantId: createdClubs[p.clubSlug].id }, // Reasignación en caso de recrear
            create: {
                userId: user.id,
                rut: p.rut,
                slug: p.slug,
                federationId: `FED-${Math.floor(1000 + Math.random() * 9000)}`,
                tenantId: createdClubs[p.clubSlug].id,
                gender: 'M',
            }
        });
    }

    // Usuario Admin General
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@fechillar.cl' },
        update: {},
        create: {
            email: 'admin@fechillar.cl',
            name: 'Administrador SGF',
            role: 'FEDERATION_ADMIN',
            passwordHash: 'admin123'
        },
    });

    // ----------------------------------------------------
    // 3. TORNEOS NACIONALES (FEDERATION_MANAGED / NATIONAL)
    // ----------------------------------------------------
    const nationalDate = new Date();
    const nationals = [
        { name: "Open La Calera 2026", desc: "Clasificatorio Norte", club: 'la-calera', m: 1 },
        { name: "Open San Miguel 2026", desc: "Torneo Metropolitano", club: 'san-miguel', m: 3 },
        { name: "Open ProPool Masters", desc: "Cierre de Temporada", club: 'pro-pool', m: 5 },
    ];

    for (const t of nationals) {
        const startDate = new Date(nationalDate.getFullYear(), nationalDate.getMonth() + t.m, 15);
        await prisma.tournament.create({
            data: {
                name: t.name,
                description: t.desc,
                discipline: "POOL",
                modality: "NINE_BALL",
                category: "HONOR",
                status: "OPEN",
                scope: "NATIONAL",
                tenantId: createdClubs[t.club].id, // El club que es sede del open
                startDate: startDate,
                endDate: new Date(startDate.getTime() + (3 * 24 * 60 * 60 * 1000)), // 3 days
            }
        });
    }

    // ----------------------------------------------------
    // 4. TORNEOS INTERNACIONALES (EXTERNAL_REFERENCE)
    // ----------------------------------------------------
    const externals = [
        { name: "Vendimia Mendoza (Argentina)", desc: "Torneo Sudamericano", m: 2 },
        { name: "Panamericano Lima (Perú)", desc: "Clasificatorio al Mundial", m: 6 },
        { name: "Copa Mundo Bogotá (Colombia)", desc: "Circuito UMB", m: 8 },
    ];

    for (const ext of externals) {
        const startDate = new Date(nationalDate.getFullYear(), nationalDate.getMonth() + ext.m, 10);
        await prisma.tournament.create({
            data: {
                name: ext.name,
                description: ext.desc,
                discipline: "CARAMBOLA",
                modality: "THREE_BAND",
                category: "HONOR",
                status: "OPEN",
                scope: "EXTERNAL_REFERENCE",
                startDate: startDate,
                endDate: new Date(startDate.getTime() + (5 * 24 * 60 * 60 * 1000)), // 5 days
            }
        });
    }

    // ----------------------------------------------------
    // 5. RANKING Y PULL DE INSCRIPCIÓN (PRUEBA UAT)
    // ----------------------------------------------------
    const openLaCalera = await prisma.tournament.findFirst({
        where: { name: "Open La Calera 2026" }
    });

    if (openLaCalera) {
        // Encontrar a los 3 mejores
        const felipe = await prisma.user.findFirst({ where: { email: 'fgallegos@propool.cl' }, include: { playerProfile: true }});
        const alejandro = await prisma.user.findFirst({ where: { email: 'acarvajal@santiago.cl' }, include: { playerProfile: true }});
        const enrique = await prisma.user.findFirst({ where: { email: 'elobo@ovalle.cl' }, include: { playerProfile: true }});

        const top3 = [
            { player: felipe?.playerProfile, points: 1500 },
            { player: alejandro?.playerProfile, points: 1350 },
            { player: enrique?.playerProfile, points: 1100 }
        ];

        for (const t of top3) {
            if (t.player) {
                // Crear ranking
                await prisma.ranking.upsert({
                    where: {
                        playerId_discipline_category: {
                            playerId: t.player.id,
                            discipline: openLaCalera.discipline,
                            category: openLaCalera.category
                        }
                    },
                    update: {},
                    create: {
                        playerId: t.player.id,
                        discipline: openLaCalera.discipline,
                        category: openLaCalera.category,
                        points: t.points,
                        rankPosition: top3.indexOf(t) + 1
                    }
                });

                const isFelipe = t.player.userId === felipe?.id;
                
                // Inscribir al torneo con puntos congelados
                await prisma.tournamentRegistration.upsert({
                    where: {
                        tournamentId_playerId: {
                            tournamentId: openLaCalera.id,
                            playerId: t.player.id
                        }
                    },
                    update: {},
                    create: {
                        tournamentId: openLaCalera.id,
                        playerId: t.player.id,
                        registeredPoints: t.points,
                        status: isFelipe ? "APPROVED" : "PENDING", // PENDING para los de UAT real, pero para el script... 
                        paid: isFelipe,
                        paymentStatus: isFelipe ? "PAID" : "PENDING",
                        amountPaid: isFelipe ? 15000 : null,
                        paymentRef: isFelipe ? "REF-INIT-001" : null,
                        paidAt: isFelipe ? new Date() : null
                    }
                });
            }
        }

        // ====================================================
        // 6. GENERACIÓN DEL MATCHMAKING (Ronda 1)
        // ====================================================
        // Como el script pide generarlo automático sin usar la UI:
        const inscriptions = await prisma.tournamentRegistration.findMany({
            where: { tournamentId: openLaCalera.id }, // Asumimos que la Federación aprueba a los 3
            orderBy: { registeredPoints: 'desc' }
        });

        // 3 Jugadores -> Bracket de 4. 2 Partidos.
        const matchesToInsert = [];
        const bracketSize = 4;
        for (let i = 0; i < bracketSize / 2; i++) {
            const homeIndex = i;
            const awayIndex = bracketSize - 1 - i;
            const home = inscriptions[homeIndex];
            const away = inscriptions[awayIndex];

            matchesToInsert.push({
                tournamentId: openLaCalera.id,
                round: 1,
                matchOrder: i + 1,
                tableNumber: i === 0 ? "1 (TV)" : "2",
                homePlayerId: home ? home.playerId : "ERROR",
                awayPlayerId: away ? away.playerId : null,
                isWO: !away
            });
        }
        
        await prisma.match.deleteMany({ where: { tournamentId: openLaCalera.id }});
        await prisma.match.createMany({ data: matchesToInsert.filter(m => m.homePlayerId !== "ERROR") });

        // ====================================================
        // 7. SIMULACIÓN DE PROPAGACIÓN (RESULTADOS RONDA 1)
        // ====================================================
        const r1Matches = await prisma.match.findMany({ where: { tournamentId: openLaCalera.id, round: 1 }, orderBy: { matchOrder: 'asc' }});
        
        // M1: Felipe Gallegos vs BYE (WO)
        if (r1Matches[0]) {
            const m1 = r1Matches[0];
            await prisma.match.update({ where: { id: m1.id }, data: { winnerId: m1.homePlayerId }});
            // Propagar a Ronda 2
            await prisma.match.create({
                data: {
                    tournamentId: openLaCalera.id,
                    round: 2,
                    matchOrder: 1,
                    tableNumber: "1 (TV)",
                    homePlayerId: m1.homePlayerId,
                    awayPlayerId: null // Esperando a Carvajal
                }
            });
        }

        // M2: Carvajal vs Lobo
        if (r1Matches[1]) {
            const m2 = r1Matches[1];
            // Simulamos 15-8 a favor de Carvajal (HomePlayer)
            await prisma.match.update({
                where: { id: m2.id },
                data: {
                    homeScore: 15,
                    awayScore: 8,
                    winnerId: m2.homePlayerId
                }
            });
            // Propagar Carvajal a Ronda 2 hacia el hueco away
             const nextMatch = await prisma.match.findFirst({
                 where: { tournamentId: openLaCalera.id, round: 2, matchOrder: 1 }
             });
             if (nextMatch) {
                 await prisma.match.update({
                     where: { id: nextMatch.id },
                     data: { awayPlayerId: m2.homePlayerId }
                 });
             }
        }
        
        // ====================================================
        // 8. SIMULACIÓN DE LA GRAN FINAL Y CLAUSURA (RANKINGS)
        // ====================================================
        const finalMatch = await prisma.match.findFirst({
            where: { tournamentId: openLaCalera.id, round: 2, matchOrder: 1 }
        });

        if (finalMatch && finalMatch.awayPlayerId) {
            // Gallegos (Home) vs Carvajal (Away)
            // Gana Gallegos espectacularmente 15-13
            await prisma.match.update({
                where: { id: finalMatch.id },
                data: {
                    homeScore: 15,
                    awayScore: 13,
                    winnerId: finalMatch.homePlayerId
                }
            });

            // Motor de Rankings Absolutos (Clausura)
            await prisma.tournament.update({
                where: { id: openLaCalera.id },
                data: { status: "FINISHED" }
            });

            // Dar Puntos
            const championId = finalMatch.homePlayerId; // Gallegos
            const runnerUpId = finalMatch.awayPlayerId; // Carvajal

            const disciplines = { disc: openLaCalera.discipline, cat: openLaCalera.category };

            // +60 Gallegos
            const rankingG = await prisma.ranking.findFirst({ where: { playerId: championId, discipline: disciplines.disc, category: disciplines.cat }});
            if (rankingG) {
                await prisma.ranking.update({ where: { id: rankingG.id }, data: { points: rankingG.points + 60 }});
            }

            // +40 Carvajal
            const rankingC = await prisma.ranking.findFirst({ where: { playerId: runnerUpId, discipline: disciplines.disc, category: disciplines.cat }});
            if (rankingC) {
                await prisma.ranking.update({ where: { id: rankingC.id }, data: { points: rankingC.points + 40 }});
            }

            // Audit
            await prisma.auditLog.create({
                data: {
                    action: "TOURNAMENT_CLOSURE",
                    targetId: openLaCalera.id,
                    userId: adminUser.id, // SGF Admin
                    details: "Torneo Open La Calera clausurado. Campeón asignado: +60 puntos."
                }
            });
        }
    }

    console.log('✅ Base de datos de SGF poblada con Jugadores Élite, Ecosistema de Cuadros y Semillas Propagadas.');
}


main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });