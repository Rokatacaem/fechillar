const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para convertir "APELLIDO Nombre" a "Nombre Apellido" y generar slug
function parsePlayerName(fullName) {
    // Dividir por espacio
    const parts = fullName.trim().split(/\s+/);

    if (parts.length < 2) {
        return { firstName: parts[0], lastName: '', slug: normalizeSlug(parts[0]) };
    }

    // El primer elemento es el apellido (en mayúsculas)
    const lastName = parts[0];

    // El resto es el nombre
    const firstName = parts.slice(1).join(' ');

    const slug = normalizeSlug(`${firstName}-${lastName}`);

    return { firstName, lastName, slug };
}

function normalizeSlug(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// TODOS los jugadores del Ranking Anual 2025 (extraídos de las capturas)
const rankingAnual2025 = [
    { rank: 1, name: "SOBARZO Marco", points: 180 },
    { rank: 2, name: "BAHAMONDES Luis", points: 150 },
    { rank: 3, name: "ZUÑIGA Rodrigo", points: 115 },
    { rank: 4, name: "DIAZ Jorge", points: 110 },
    { rank: 5, name: "SARMIENTO Peter", points: 90 },
    { rank: 6, name: "PEÑA Marcelo", points: 80 },
    { rank: 7, name: "ARENAS Bladimir", points: 80 },
    { rank: 8, name: "ZAMBRA Marcelo", points: 70 },
    { rank: 9, name: "CARVAJAL Alejandro", points: 70 },
    { rank: 10, name: "OLAYA Carlos", points: 70 },
    { rank: 11, name: "SALINAS D. Ulises", points: 65 },
    { rank: 12, name: "RUBILAR Cristian", points: 60 },
    { rank: 13, name: "DIAZ Mario", points: 60 },
    { rank: 14, name: "BERNAL Ariel", points: 60 },
    { rank: 15, name: "OSTOS Juan C.", points: 55 },
    { rank: 16, name: "CHICUREL Pablo", points: 50 },
    { rank: 17, name: "COFRE Mario", points: 50 },
    { rank: 18, name: "GUERRA Carlos", points: 45 },
    { rank: 19, name: "CASTILLO Jorge", points: 45 },
    { rank: 20, name: "RUBINO Luis", points: 40 },
    { rank: 21, name: "PONCE Ricardo", points: 40 },
    { rank: 22, name: "BUSTOS Luis", points: 40 },
    { rank: 23, name: "SILVA Rodolfo", points: 35 },
    { rank: 24, name: "TRUJILLO Jorge", points: 35 },
    { rank: 25, name: "VALLE Florian", points: 30 },
    { rank: 26, name: "OROZCO Rogelio", points: 30 },
    { rank: 27, name: "HADAD Camilo", points: 30 },
    { rank: 28, name: "ALFARO Ricardo", points: 25 },
    { rank: 29, name: "TOBAR Cesar", points: 20 },
    { rank: 30, name: "OLIVARES Cristobal", points: 20 },
    { rank: 31, name: "PULGAR Manuel", points: 20 },
    { rank: 32, name: "FERNANDEZ Benjamin", points: 20 },
    { rank: 33, name: "MARSHALL Francisco", points: 20 },
    { rank: 34, name: "SALAS Nelson", points: 20 },
    { rank: 35, name: "CHAHUAN Yeries", points: 15 },
    { rank: 36, name: "RIOJA Cristian", points: 15 },
    { rank: 37, name: "SALINAS Jose", points: 15 },
    { rank: 38, name: "RODRIGUEZ Jose", points: 15 },
    { rank: 39, name: "LEDEZMA Guillermo", points: 15 },
    { rank: 40, name: "DUARTE Marco", points: 10 },
    { rank: 41, name: "MANTEROLA Jose", points: 10 },
    { rank: 42, name: "GOMEZ Manuel", points: 10 },
    { rank: 43, name: "LAZO Moises", points: 5 },
    { rank: 44, name: "YOVANOVIC Ivo", points: 5 },
    { rank: 45, name: "ITER Alfredo", points: 5 },
    { rank: 46, name: "PIZARRO Alex", points: 0 },
    { rank: 47, name: "TORO Juan C.", points: 50 },
    { rank: 48, name: "MATUS Silvio", points: 40 },
    { rank: 49, name: "JOHNSON J. Carlos", points: 35 },
    { rank: 50, name: "SUSUNAGA Oscar", points: 30 },
    { rank: 51, name: "ZAMBRA Alejandro", points: 30 },
    { rank: 52, name: "ROJAS Leopoldo", points: 30 },
    { rank: 53, name: "BURGOS Patricio", points: 20 },
    { rank: 54, name: "LEON Mario", points: 20 },
    { rank: 55, name: "CABALLERO Julio", points: 20 },
    { rank: 56, name: "SAAVEDRA Victor", points: 20 },
    { rank: 57, name: "ROJAS Orlando", points: 20 },
    { rank: 58, name: "ARENAS Jesus", points: 15 },
    { rank: 59, name: "ILLANES Carlos", points: 15 },
    { rank: 60, name: "ROA Robinson", points: 15 },
    { rank: 61, name: "NIEVES Irving", points: 15 },
    { rank: 62, name: "ARAVENA Jorge", points: 15 },
    { rank: 63, name: "MANCILLA Rodrigo", points: 15 },
    { rank: 64, name: "ARANDA Eduardo", points: 10 },
    { rank: 65, name: "PLAZA Pedro", points: 10 },
    { rank: 66, name: "SAENZ Carlos", points: 10 },
    { rank: 67, name: "SANCHEZ Guillermo", points: 10 },
    { rank: 68, name: "DECEBAL Jorge", points: 10 },
    { rank: 69, name: "TORRES Miguel", points: 10 },
    { rank: 70, name: "GARAY Marco", points: 10 },
    { rank: 71, name: "PLAZA Pablo", points: 10 },
    { rank: 72, name: "BENASSI Giorgio", points: 5 },
    { rank: 73, name: "CARVALLO Francisco", points: 5 },
    { rank: 74, name: "MANCISIDOR Octavio", points: 5 },
    { rank: 75, name: "LEIVA Patricio", points: 5 },
    { rank: 76, name: "FLORES Josep", points: 5 },
    { rank: 77, name: "MEDINA Claudio", points: 5 },
    { rank: 78, name: "CACERES Marco", points: 5 },
    { rank: 79, name: "CARVAJAL Patricio", points: 5 },
    { rank: 80, name: "BARRERA Juan", points: 5 },
    { rank: 81, name: "MONTAÑA Felipe", points: 5 },
    { rank: 82, name: "ALFARO Luis", points: 0 },
    { rank: 83, name: "ORTIZ Alexis", points: 0 },
    { rank: 84, name: "PAILACURA Carlos", points: 0 },
    { rank: 85, name: "RAMIREZ Fernando", points: 0 },
    { rank: 86, name: "MIRANDA Hugo", points: 0 },
    { rank: 87, name: "LOPEZ Eduardo", points: 0 },
    { rank: 88, name: "RIFFO Alejandro", points: 40 },
    { rank: 89, name: "MEZA Hugo", points: 35 },
    { rank: 90, name: "ORTIZ Alexi", points: 20 },
    { rank: 91, name: "PORRAS Andres", points: 10 },
    { rank: 92, name: "ROJAS Adolfo", points: 10 },
    { rank: 93, name: "ROJAS Osvaldo", points: 10 },
    { rank: 94, name: "NARANJO Brisley", points: 5 },
    { rank: 95, name: "RIVERA Jose L.", points: 5 },
    { rank: 96, name: "REYES Jorge", points: 5 },
    { rank: 97, name: "APABLAZA Gino", points: 5 },
    { rank: 98, name: "ROJAS Aldo", points: 5 },
    { rank: 99, name: "ROLDAN Johan", points: 5 },
    { rank: 100, name: "SELMAN Marco", points: 5 },
    { rank: 101, name: "GALLARDO Emilio", points: 5 },
    { rank: 102, name: "ESQUIVEL Pablo", points: 0 },
    { rank: 103, name: "REBOLLEDO Victor", points: 0 },
    { rank: 104, name: "OYARZUN Rigoberto", points: 0 },
    { rank: 105, name: "FLORES Angelo", points: 0 },
    { rank: 106, name: "MIRANDA Edio", points: 0 },
    { rank: 107, name: "TORRES Hernan", points: 0 },
    { rank: 108, name: "TORO Julio", points: 0 },
    { rank: 109, name: "ALBORNOZ Andres", points: 0 },
    { rank: 110, name: "GUAJARDO Carlos", points: 0 },
    { rank: 111, name: "ARENAS John", points: 0 },
    { rank: 112, name: "CACUA Carlos", points: 0 },
    { rank: 113, name: "SILVA Oscar", points: 0 },
    { rank: 114, name: "AYALA Wilson", points: 0 },
    { rank: 115, name: "ORREGO Juan C.", points: 0 },
    { rank: 116, name: "UGARTE Eduardo", points: 0 },
    { rank: 117, name: "ARAYA Eduardo", points: 0 },
    { rank: 118, name: "ZAMBRA Claudio", points: 0 },
    { rank: 119, name: "PIZARRO Juan", points: 0 },
    { rank: 120, name: "BRICENO Heriberto", points: 0 },
    { rank: 121, name: "RODRIGUEZ Donato", points: 0 },
    { rank: 122, name: "LILLO Juan", points: 0 },
    { rank: 123, name: "ARANCIBIA Oscar", points: 0 },
    { rank: 124, name: "GUTIERREZ Elvia", points: 0 },
    { rank: 125, name: "LUZ Oscar", points: 0 },
    { rank: 126, name: "VELASQUEZ Luis", points: 0 },
    { rank: 127, name: "AROCA Francisco", points: 0 },
    { rank: 128, name: "QUINTERO Luis", points: 0 },
    { rank: 129, name: "FLORES Miguel", points: 0 },
    { rank: 130, name: "ORDENES Mario", points: 0 },
    { rank: 131, name: "BRICENO Carlos", points: 0 },
    { rank: 132, name: "MALDONADO Juan Carlos", points: 0 },
    { rank: 133, name: "CORTEZ Jose", points: 0 },
    { rank: 134, name: "FLORES Angello", points: 0 },
    { rank: 135, name: "GONZALEZ Yohan", points: 0 },
    { rank: 136, name: "ARANCIBIA Daniel", points: 0 },
    { rank: 137, name: "OLGUIN Alejandro", points: 0 },
    { rank: 138, name: "MEJIAS Didier", points: 0 },
    { rank: 139, name: "SANTIAGOS Nelson", points: 0 },
    { rank: 140, name: "FAGERSTROM Adolfo", points: 0 },
    { rank: 141, name: "BARRAZA Alvaro", points: 0 },
    { rank: 142, name: "CORROTEA Victor", points: 0 },
    { rank: 143, name: "SASTRE Eduard", points: 0 },
    { rank: 144, name: "VENEGAS Eduardo", points: 0 },
    { rank: 145, name: "CELIS Alexis", points: 0 },
    { rank: 146, name: "ESPINOZA Victor", points: 0 },
    { rank: 147, name: "PAREDES Arnaldo", points: 0 }
];

async function createMissingPlayers() {
    try {
        console.log('🎯 CREANDO JUGADORES FALTANTES DEL RANKING ANUAL 2025\n');
        console.log(`📊 Total en ranking: ${rankingAnual2025.length} jugadores\n`);

        // Obtener todos los jugadores existentes
        const existingPlayers = await prisma.playerProfile.findMany({
            select: { firstName: true, lastName: true, slug: true }
        });

        console.log(`✅ Jugadores actuales en BD: ${existingPlayers.length}\n`);

        let created = 0;
        let skipped = 0;
        const notFound = [];

        for (const player of rankingAnual2025) {
            const { firstName, lastName, slug } = parsePlayerName(player.name);

            // Verificar si existe (por slug o nombre exacto)
            const exists = existingPlayers.some(p =>
                p.slug === slug ||
                (p.firstName === firstName && p.lastName === lastName)
            );

            if (exists) {
                skipped++;
                continue;
            }

            // Crear jugador
            try {
                await prisma.playerProfile.create({
                    data: {
                        firstName,
                        lastName,
                        slug
                    }
                });
                created++;
                console.log(`   ${created}. Creado: ${firstName} ${lastName}`);
            } catch (error) {
                notFound.push({ name: player.name, error: error.message });
            }
        }

        console.log('\n═══════════════════════════════════════════════════');
        console.log('✅ PROCESO COMPLETADO');
        console.log('═══════════════════════════════════════════════════\n');
        console.log(`📊 Estadísticas:`);
        console.log(`   Total en ranking: ${rankingAnual2025.length}`);
        console.log(`   Ya existían: ${skipped}`);
        console.log(`   Creados ahora: ${created}`);
        console.log(`   Errores: ${notFound.length}\n`);

        if (notFound.length > 0) {
            console.log('⚠️  Jugadores con errores:');
            notFound.forEach(p => console.log(`   - ${p.name}: ${p.error}`));
        }

        const totalNow = await prisma.playerProfile.count();
        console.log(`\n✅ Total jugadores en BD: ${totalNow}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createMissingPlayers();