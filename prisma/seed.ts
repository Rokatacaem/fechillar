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
        { email: 'fgallegos@propool.cl', name: 'Felipe Gallegos', rut: '15.111.222-3', clubSlug: 'pro-pool' },
        { email: 'acarvajal@santiago.cl', name: 'Alejandro Carvajal', rut: '16.222.333-4', clubSlug: 'santiago' },
        { email: 'elobo@ovalle.cl', name: 'Enrique Lobo', rut: '14.333.444-5', clubSlug: 'ovalle' },
        { email: 'jmartinez@patagonia.cl', name: 'Javier Martínez', rut: '17.444.555-6', clubSlug: 'patagonia' },
        { email: 'psuarez@sanmiguel.cl', name: 'Pablo Suárez', rut: '18.555.666-7', clubSlug: 'san-miguel' },
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
                federationId: \`FED-\${Math.floor(1000 + Math.random() * 9000)}\`,
                tenantId: createdClubs[p.clubSlug].id,
                gender: 'M',
            }
        });
    }

    // Usuario Admin General
    await prisma.user.upsert({
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
                status: "UPCOMING",
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
                status: "UPCOMING",
                scope: "EXTERNAL_REFERENCE",
                startDate: startDate,
                endDate: new Date(startDate.getTime() + (5 * 24 * 60 * 60 * 1000)), // 5 days
            }
        });
    }

    console.log('✅ Base de datos de SGF poblada con Jugadores Élite y Calendario FECHILLAR 2026.');
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });