const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  try {
    console.log('🛡️ Iniciando backup de Fechillar...');
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Crear carpeta de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Exportar todas las tablas
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        clubs: await prisma.club.findMany(),
        players: await prisma.playerProfile.findMany(),
        rankings: await prisma.ranking.findMany(),
        tournaments: await prisma.tournament.findMany(),
        registrations: await prisma.tournamentRegistration.findMany(),
        groups: await prisma.tournamentGroup.findMany(),
        matches: await prisma.match.findMany(),
        phases: await prisma.tournamentPhase.findMany()
      },
      stats: {
        totalClubs: 0,
        totalPlayers: 0,
        totalRankings: 0,
        totalTournaments: 0
      }
    };

    // Calcular estadísticas
    data.stats.totalClubs = data.data.clubs.length;
    data.stats.totalPlayers = data.data.players.length;
    data.stats.totalRankings = data.data.rankings.length;
    data.stats.totalTournaments = data.data.tournaments.length;

    // Guardar backup
    const filename = `backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log('\n✅ BACKUP COMPLETADO EXITOSAMENTE\n');
    console.log('📊 Estadísticas:');
    console.log(`   • ${data.stats.totalClubs} clubes`);
    console.log(`   • ${data.stats.totalPlayers} jugadores`);
    console.log(`   • ${data.stats.totalRankings} rankings`);
    console.log(`   • ${data.stats.totalTournaments} torneos`);
    console.log(`\n📁 Archivo: ${filepath}`);
    console.log(`💾 Tamaño: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB\n`);

    await prisma.$disconnect();
    return filepath;

  } catch (error) {
    console.error('❌ Error creando backup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createBackup();
