const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restore(backupFile) {
  try {
    console.log('🔄 Iniciando restauración...');
    
    if (!backupFile) {
      console.error('❌ Debes especificar el archivo de backup');
      console.log('Uso: npm run restore -- backups/backup_YYYY-MM-DD.json');
      process.exit(1);
    }

    const filepath = path.join(__dirname, '..', backupFile);
    
    if (!fs.existsSync(filepath)) {
      console.error('❌ Archivo no encontrado:', filepath);
      process.exit(1);
    }

    const backup = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    console.log(`📅 Backup creado: ${backup.timestamp}`);
    console.log(`📊 Contiene:`);
    console.log(`   • ${backup.stats.totalClubs} clubes`);
    console.log(`   • ${backup.stats.totalPlayers} jugadores`);
    console.log(`   • ${backup.stats.totalRankings} rankings`);
    console.log(`   • ${backup.stats.totalTournaments} torneos`);
    
    console.log('\n⚠️  ADVERTENCIA: Esto ELIMINARÁ todos los datos actuales');
    console.log('Presiona Ctrl+C para cancelar en los próximos 5 segundos...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Limpiar base de datos
    console.log('🗑️  Limpiando base de datos...');
    await prisma.match.deleteMany();
    await prisma.tournamentGroup.deleteMany();
    await prisma.tournamentRegistration.deleteMany();
    await prisma.tournamentPhase.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.ranking.deleteMany();
    await prisma.playerProfile.deleteMany();
    await prisma.club.deleteMany();

    // Restaurar datos
    console.log('📥 Restaurando datos...');
    
    for (const club of backup.data.clubs) {
      await prisma.club.create({ data: club });
    }
    
    for (const player of backup.data.players) {
      const { rankings, club, ...playerData } = player;
      await prisma.playerProfile.create({ data: playerData });
    }
    
    for (const ranking of backup.data.rankings) {
      await prisma.ranking.create({ data: ranking });
    }

    console.log('\n✅ RESTAURACIÓN COMPLETADA\n');
    
    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Error restaurando backup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

const backupFile = process.argv[2];
restore(backupFile);
