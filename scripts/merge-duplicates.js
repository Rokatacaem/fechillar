const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function mergeDuplicates() {
    console.log('🔄 Iniciando fusión de registros duplicados...');
    
    if (!fs.existsSync('duplicates-report.json')) {
        console.error('❌ Archivo duplicates-report.json no encontrado. Ejecuta db:duplicates primero.');
        return;
    }

    const report = JSON.parse(fs.readFileSync('duplicates-report.json', 'utf8'));

    for (const group of report) {
        console.log(`\n👨‍🦰 Grupo: ${group.normalizedName}`);
        
        // Determinar el registro "canónico" (el principal a mantener)
        // Criterio: El que tenga email, o el que tenga más inscripciones, o el que esté mejor formateado.
        let canonical = group.records.find(r => r.email) || 
                        group.records.reduce((prev, current) => (prev.registrationsCount > current.registrationsCount) ? prev : current);
        
        // Preferir el que tiene tilde si todo lo demás es igual
        const withTilde = group.records.find(r => r.name !== r.name.toUpperCase() && r.name !== r.name.toLowerCase());
        if (!canonical.email && canonical.registrationsCount === 0 && withTilde) {
            canonical = withTilde;
        }

        const duplicates = group.records.filter(r => r.id !== canonical.id);

        console.log(`   ✅ Mantener: ${canonical.name} (${canonical.id})`);

        for (const duplicate of duplicates) {
            console.log(`   🗑️ Fusionando y eliminando: ${duplicate.name} (${duplicate.id})`);

            // 1. Mover Rankings
            const duplicateRankings = await prisma.ranking.findMany({ where: { playerId: duplicate.id } });
            for (const r of duplicateRankings) {
                try {
                    await prisma.ranking.update({
                        where: { id: r.id },
                        data: { playerId: canonical.id }
                    });
                } catch (e) {
                    // Si ya existe un ranking para esa disciplina/categoría, podríamos sumar puntos, pero 
                    // por simplicidad lo borramos para no romper la base de datos (se puede reajustar manual si es necesario).
                    console.log(`      ⚠️ Conflicto de ranking (${r.discipline}). Se conservará el del registro principal.`);
                    await prisma.ranking.delete({ where: { id: r.id } });
                }
            }

            // 2. Mover Registrations (Inscripciones a torneos)
            const duplicateRegistrations = await prisma.tournamentRegistration.findMany({ where: { playerId: duplicate.id } });
            for (const reg of duplicateRegistrations) {
                try {
                    await prisma.tournamentRegistration.update({
                        where: { id: reg.id },
                        data: { playerId: canonical.id }
                    });
                } catch (e) {
                    console.log(`      ⚠️ Conflicto de inscripción al torneo. Se borrará la duplicada.`);
                    await prisma.tournamentRegistration.delete({ where: { id: reg.id } });
                }
            }

            // 3. Eliminar el registro duplicado de PlayerProfile
            try {
                await prisma.playerProfile.delete({ where: { id: duplicate.id } });
                console.log(`      ✔️ Perfil duplicado eliminado.`);
            } catch (e) {
                console.log(`      ❌ No se pudo eliminar ${duplicate.id} por relaciones restantes (ej. partidos jugados).`);
            }
        }
    }

    console.log('\n✨ Fusión completada.');
    await prisma.$disconnect();
}

mergeDuplicates().catch(console.error);
