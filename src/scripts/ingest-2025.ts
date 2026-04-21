import { PrismaClient, Discipline, Category, UserRole } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// CONFIGURACIÓN DE RUTAS
const DOWNLOADS_PATH = path.join(process.env.USERPROFILE || "", "Downloads");
const MAPPING_FILE = path.join(DOWNLOADS_PATH, "mapeo_jugadores_2025.csv");
const RANKING_FILE = path.join(DOWNLOADS_PATH, "ranking_sgf_completo_2025.csv");

// CATEGORÍA POR DEFECTO (Asignada a "Sin Categoría")
const DEFAULT_CATEGORY = Category.THIRD; 

async function main() {
    console.log("🚀 Iniciando Ingesta Atómica 2025...");

    if (!fs.existsSync(MAPPING_FILE)) throw new Error("Archivo de mapeo no encontrado en Descargas.");
    if (!fs.existsSync(RANKING_FILE)) throw new Error("Archivo de ranking no encontrado en Descargas.");

    // 1. Cargar Clubes Actuales para Mapeo
    const dbClubs = await prisma.club.findMany();
    const clubMap = new Map();
    dbClubs.forEach(c => {
        clubMap.set(c.name.toUpperCase(), c.id);
        clubMap.set(c.slug.toUpperCase(), c.id);
    });

    console.log(`✅ ${dbClubs.length} Clubes cargados para reconciliación.`);

    // 2. Parsear Ranking (Fuente de Estadísticas)
    const rankingLines = fs.readFileSync(RANKING_FILE, "utf-8").split("\n").slice(1);
    const statsMap = new Map();

    rankingLines.forEach(line => {
        const [ranking, idExt, nombre, club, puntos, carambolas, entradas, torneos, promedio] = line.split(",");
        if (idExt) {
            statsMap.set(idExt.trim(), {
                puntos: parseFloat(puntos),
                carambolas: parseFloat(carambolas),
                entradas: parseFloat(entradas),
                promedio: parseFloat(promedio)
            });
        }
    });

    // 3. Procesar Mapeo e Inyectar
    const mappingLines = fs.readFileSync(MAPPING_FILE, "utf-8").split("\n").slice(1);
    let successCount = 0;

    for (const line of mappingLines) {
        if (!line.trim()) continue;
        const [idExt, nombre, clubName, rut, email] = line.split(",");

        if (!idExt || !nombre) continue;

        const cleanIdExt = idExt.trim();
        const cleanNombre = nombre.trim();
        const cleanClub = clubName?.trim().toUpperCase();
        const cleanRut = rut?.trim();
        const cleanEmail = email?.trim() || `${cleanRut || cleanIdExt}@fechillar.cl`;

        // Buscar ID de Club
        const targetClubId = clubMap.get(cleanClub) || null;

        try {
            await prisma.$transaction(async (tx) => {
                // A. Crear/Actualizar Usuario
                const user = await tx.user.upsert({
                    where: { email: cleanEmail },
                    update: { name: cleanNombre },
                    create: {
                        email: cleanEmail,
                        name: cleanNombre,
                        role: UserRole.PLAYER
                    }
                });

                // B. Crear/Actualizar Perfil de Jugador
                const slug = cleanNombre.toLowerCase().replace(/ /g, "-") + "-" + (cleanRut || cleanIdExt);
                const player = await tx.playerProfile.upsert({
                    where: { userId: user.id },
                    update: {
                        rut: cleanRut || null,
                        federationId: cleanIdExt,
                        tenantId: targetClubId
                    },
                    create: {
                        userId: user.id,
                        slug: slug,
                        rut: cleanRut || null,
                        federationId: cleanIdExt,
                        tenantId: targetClubId
                    }
                });

                // C. Inyectar Ranking Histórico 2025
                const stats = statsMap.get(cleanIdExt);
                if (stats) {
                    await tx.ranking.upsert({
                        where: {
                            playerId_discipline_category: {
                                playerId: player.id,
                                discipline: Discipline.THREE_BAND,
                                category: DEFAULT_CATEGORY
                            }
                        },
                        update: {
                            points: Math.round(stats.puntos),
                            average: stats.promedio
                        },
                        create: {
                            playerId: player.id,
                            discipline: Discipline.THREE_BAND,
                            category: DEFAULT_CATEGORY,
                            points: Math.round(stats.puntos),
                            average: stats.promedio
                        }
                    });
                }
            });

            successCount++;
            if (successCount % 10 === 0) console.log(`⏳ Procesados ${successCount} jugadores...`);
        } catch (error) {
            console.error(`❌ Error procesando a ${cleanNombre}:`, error);
        }
    }

    console.log(`\n✨ INGESTA FINALIZADA ✨`);
    console.log(`Total Jugadores Procesados: ${successCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
