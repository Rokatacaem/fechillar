const fs = require('fs');
const path = require('path');

const VERCEL_URL = process.env.VERCEL_URL || 'https://fechillar-three.vercel.app';
const SYNC_SECRET = process.env.SYNC_SECRET;
const RESTORE_ENDPOINT = `${VERCEL_URL}/api/admin/restore-backup`;

function getLatestBackup() {
    const backupDir = path.join(__dirname, '..', 'backups');
    const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.json') && f.startsWith('backup'))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(backupDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
        console.error('❌ No se encontraron backups en backups/');
        console.log('   Ejecuta primero: npm run backup');
        process.exit(1);
    }

    return path.join(backupDir, files[0].name);
}

async function sync() {
    if (!SYNC_SECRET) {
        console.error('❌ Falta la variable SYNC_SECRET en .env');
        process.exit(1);
    }

    const backupPath = process.argv[2]
        ? path.resolve(process.argv[2])
        : getLatestBackup();

    if (!fs.existsSync(backupPath)) {
        console.error('❌ Archivo no encontrado:', backupPath);
        process.exit(1);
    }

    console.log('📂 Usando backup:', path.basename(backupPath));

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    const stats = backupData.data;
    console.log('📊 Contenido:');
    console.log(`   • ${stats.clubs?.length ?? 0} clubes`);
    console.log(`   • ${stats.players?.length ?? 0} jugadores`);
    console.log(`   • ${stats.rankings?.length ?? 0} rankings`);
    console.log(`   • ${stats.tournaments?.length ?? 0} torneos`);
    console.log(`   • ${stats.registrations?.length ?? 0} inscripciones`);
    console.log(`\n🚀 Enviando a ${RESTORE_ENDPOINT}...\n`);

    try {
        const response = await fetch(RESTORE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-sync-secret': SYNC_SECRET,
            },
            body: JSON.stringify(backupData),
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Sincronización exitosa');
            console.log('   Mensaje:', result.message);
            console.log('   Stats:', JSON.stringify(result.stats, null, 4));
        } else {
            console.error('❌ Error en la sincronización:', result.error);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error de red:', error.message);
        process.exit(1);
    }
}

sync();
