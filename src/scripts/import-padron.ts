import { PrismaClient, Discipline, Category } from "@prisma/client";

const prisma = new PrismaClient();

interface AthleteImport {
    rut: string;
    nombre: string;
    clubNombre: string;
    rankingActual: number;
    promedioBase: number;
    categoria: string;
}

/**
 * Script de Importación del Padrón Nacional
 * Ejecución: npx tsx src/scripts/import-padron.ts
 */
async function main() {
    console.log("🚀 Iniciando importación de Padrón Nacional...");

    // Ejemplo de datos (En producción esto vendría de un CSV o Excel)
    const athletes: AthleteImport[] = [
        {
            rut: "12345678-9",
            nombre: "Juan Perez",
            clubNombre: "Club Billar Santiago",
            rankingActual: 1200,
            promedioBase: 0.850,
            categoria: "MASTER"
        },
        {
            rut: "98765432-1",
            nombre: "Diego Valenzuela",
            clubNombre: "Club 3 Bandas Valparaíso",
            rankingActual: 1150,
            promedioBase: 0.720,
            categoria: "HONOR"
        }
    ];

    for (const athlete of athletes) {
        try {
            // 1. Buscar o Crear el Club
            const club = await prisma.club.upsert({
                where: { slug: athlete.clubNombre.toLowerCase().replace(/ /g, "-") },
                update: {},
                create: {
                    name: athlete.clubNombre,
                    slug: athlete.clubNombre.toLowerCase().replace(/ /g, "-")
                }
            });

            // 2. Upsert del Perfil del Jugador
            const names = athlete.nombre.split(" ");
            const firstName = names[0];
            const lastName = names.slice(1).join(" ");

            const player = await prisma.playerProfile.upsert({
                where: { rut: athlete.rut },
                update: {
                    averageBase: athlete.promedioBase,
                    tenantId: club.id,
                },
                create: {
                    rut: athlete.rut,
                    firstName,
                    lastName,
                    slug: athlete.rut,
                    averageBase: athlete.promedioBase,
                    tenantId: club.id,
                }
            });

            // 3. Inicializar Ranking si no existe
            await prisma.ranking.upsert({
                where: {
                    playerId_discipline_category: {
                        playerId: player.id,
                        discipline: "THREE_BAND",
                        category: athlete.categoria as Category
                    }
                },
                update: {
                    points: athlete.rankingActual,
                    average: athlete.promedioBase
                },
                create: {
                    playerId: player.id,
                    discipline: "THREE_BAND",
                    category: athlete.categoria as Category,
                    points: athlete.rankingActual,
                    average: athlete.promedioBase
                }
            });

            console.log(`✅ Procesado: ${athlete.nombre} (RUT: ${athlete.rut})`);
        } catch (error) {
            console.error(`❌ Error procesando ${athlete.nombre}:`, error);
        }
    }

    console.log("✨ Importación finalizada.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
