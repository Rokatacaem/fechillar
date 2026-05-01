const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function createBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupDir = path.join(process.cwd(), 'backups');

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(backupDir, filename);

        console.log('💾 GENERANDO BACKUP COMPLETO DE LA BASE DE DATOS\n');
        console.log(`📁 Archivo: ${filename}\n`);
        console.log('📊 Extrayendo datos...\n');

        // Extraer datos principales
        const clubs = await prisma.club.findMany();
        console.log(`   ✅ Clubes: ${clubs.length}`);

        const players = await prisma.playerProfile.findMany();
        console.log(`   ✅ Jugadores: ${players.length}`);

        const tournaments = await prisma.tournament.findMany();
        console.log(`   ✅ Torneos: ${tournaments.length}`);

        const registrations = await prisma.tournamentRegistration.findMany();
        console.log(`   ✅ Inscripciones: ${registrations.length}`);

        const groups = await prisma.tournamentGroup.findMany();
        console.log(`   ✅ Grupos: ${groups.length}`);

        const matches = await prisma.match.findMany();
        console.log(`   ✅ Partidos: ${matches.length}`);

        const rankings = await prisma.ranking.findMany();
        console.log(`   ✅ Rankings: ${rankings.length}`);

        const users = await prisma.user.findMany();
        console.log(`   ✅ Usuarios: ${users.length}\n`);

        const backup = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0',
                description: 'Backup completo - 178 jugadores creados del Ranking Anual 2025',
                stats: {
                    clubs: clubs.length,
                    players: players.length,
                    tournaments: tournaments.length,
                    registrations: registrations.length,
                    groups: groups.length,
                    matches: matches.length,
                    rankings: rankings.length,
                    users: users.length
                }
            },
            data: {
                clubs,
                players,
                tournaments,
                registrations,
                groups,
                matches,
                rankings,
                users
            }
        };

        // Guardar backup
        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

        console.log('═══════════════════════════════════════════════════');
        console.log('✅ BACKUP COMPLETADO EXITOSAMENTE');
        console.log('═══════════════════════════════════════════════════\n');

        console.log('📊 RESUMEN DEL BACKUP:\n');
        console.log(`   Clubes:         ${backup.metadata.stats.clubs}`);
        console.log(`   Jugadores:      ${backup.metadata.stats.players}`);
        console.log(`   Torneos:        ${backup.metadata.stats.tournaments}`);
        console.log(`   Inscripciones:  ${backup.metadata.stats.registrations}`);
        console.log(`   Grupos:         ${backup.metadata.stats.groups}`);
        console.log(`   Partidos:       ${backup.metadata.stats.matches}`);
        console.log(`   Rankings:       ${backup.metadata.stats.rankings}`);
        console.log(`   Usuarios:       ${backup.metadata.stats.users}\n`);

        const fileSize = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);
        console.log(`💾 Archivo: ${filepath}`);
        console.log(`📦 Tamaño: ${fileSize} MB\n`);

        console.log('✅ Backup listo. Puedes proceder con la importación de rankings.\n');

    } catch (error) {
        console.error('❌ Error creando backup:', error);
        console.error('\n📝 Detalles:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createBackup();
