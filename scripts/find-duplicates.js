const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Función para normalizar texto: quita tildes, espacios extra y pasa a minúsculas
function normalizeText(text) {
    if (!text) return '';
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

async function findDuplicates() {
    console.log('🔍 Buscando posibles registros duplicados (ignorando tildes y mayúsculas)...');

    const players = await prisma.playerProfile.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            rut: true,
            federationId: true,
            rankings: { select: { id: true } },
            registrations: { select: { id: true } }
        }
    });

    const groups = {};

    players.forEach(p => {
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`;
        const normalized = normalizeText(fullName);
        
        // Ignorar "eliminado" u otros basura que ya estamos limpiando
        if (normalized.includes('eliminado')) return;

        if (!groups[normalized]) {
            groups[normalized] = [];
        }
        groups[normalized].push(p);
    });

    const duplicates = [];

    for (const [key, group] of Object.entries(groups)) {
        if (group.length > 1) {
            duplicates.push({
                normalizedName: key,
                records: group.map(g => ({
                    id: g.id,
                    name: `${g.firstName} ${g.lastName}`,
                    rut: g.rut,
                    email: g.email,
                    rankingsCount: g.rankings.length,
                    registrationsCount: g.registrations.length
                }))
            });
        }
    }

    if (duplicates.length > 0) {
        console.log(`\n⚠️ Se encontraron ${duplicates.length} grupos de posibles duplicados.`);
        fs.writeFileSync('duplicates-report.json', JSON.stringify(duplicates, null, 2));
        console.log('📄 Reporte guardado en "duplicates-report.json"');
    } else {
        console.log('\n✅ No se encontraron duplicados evidentes por nombre.');
    }

    await prisma.$disconnect();
}

findDuplicates().catch(console.error);
