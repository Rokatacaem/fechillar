const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script para limpiar registros duplicados, huérfanos y perfiles marcados como "ELIMINADO".
 * Específicamente enfocado en resolver el duplicado de Rodrigo Zúñiga.
 */
async function cleanDatabase() {
    console.log('🧹 Iniciando limpieza de base de datos...\n');

    try {
        // 1. Manejo del duplicado de Rodrigo Zúñiga
        // El perfil correcto es el que tiene el nombre completo y el email de admin
        const correctRodrigo = await prisma.playerProfile.findFirst({
            where: { 
                lastName: { contains: 'Zúñiga Lobos' }
            }
        });

        const duplicateRodrigo = await prisma.playerProfile.findFirst({
            where: {
                firstName: 'Rodrigo',
                lastName: 'ZUÑIGA'
            }
        });

        if (correctRodrigo && duplicateRodrigo) {
            console.log(`📍 Detectado duplicado de Rodrigo Zúñiga:`);
            console.log(`   - Mantener: ${correctRodrigo.id} (${correctRodrigo.firstName} ${correctRodrigo.lastName})`);
            console.log(`   - Eliminar: ${duplicateRodrigo.id} (${duplicateRodrigo.firstName} ${duplicateRodrigo.lastName})`);

            // Mover rankings o registros si el duplicado tuviera algo único (opcional, aquí purgamos)
            await prisma.ranking.deleteMany({ where: { playerId: duplicateRodrigo.id } });
            await prisma.tournamentRegistration.deleteMany({ where: { playerId: duplicateRodrigo.id } });
            await prisma.playerProfile.delete({ where: { id: duplicateRodrigo.id } });
            console.log('✅ Duplicado de Rodrigo eliminado.');
        }

        // 2. Eliminar perfiles marcados como "ELIMINADO" o con slug "del-"
        const trashProfiles = await prisma.playerProfile.findMany({
            where: {
                OR: [
                    { firstName: { contains: 'ELIMINADO', mode: 'insensitive' } },
                    { slug: { startsWith: 'del-' } }
                ]
            }
        });

        console.log(`\n🗑️ Encontrados ${trashProfiles.length} perfiles basura.`);
        for (const profile of trashProfiles) {
            // No eliminar el perfil correcto si por error cayera aquí (poco probable por los filtros)
            if (correctRodrigo && profile.id === correctRodrigo.id) continue;

            console.log(`   - Eliminando perfil: ${profile.firstName} ${profile.lastName} (${profile.id})`);
            await prisma.ranking.deleteMany({ where: { playerId: profile.id } });
            await prisma.tournamentRegistration.deleteMany({ where: { playerId: profile.id } });
            
            // Intentar eliminar, capturando error si hay FKs en matches
            try {
                await prisma.playerProfile.delete({ where: { id: profile.id } });
            } catch (e) {
                console.log(`   ⚠️ No se pudo eliminar ${profile.id} por integridad referencial (posiblemente tiene partidos).`);
            }
        }

        // 3. Eliminar usuarios marcados como "ELIMINADO"
        const trashUsers = await prisma.user.findMany({
            where: {
                name: { contains: 'ELIMINADO', mode: 'insensitive' }
            }
        });

        console.log(`\n👤 Encontrados ${trashUsers.length} usuarios basura.`);
        for (const user of trashUsers) {
            console.log(`   - Eliminando usuario: ${user.name} (${user.id})`);
            // Desvincular perfiles antes de borrar usuario
            await prisma.playerProfile.updateMany({
                where: { userId: user.id },
                data: { userId: null }
            });
            await prisma.user.delete({ where: { id: user.id } });
        }

        console.log('\n✨ Limpieza finalizada exitosamente.');

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
