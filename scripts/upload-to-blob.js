const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadLatestBackup() {
    const backupDir = path.join(__dirname, '..', 'backups');
    const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.json') && f.startsWith('backup'))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(backupDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
        console.error('❌ No hay backups locales. Ejecuta primero: npm run backup');
        process.exit(1);
    }

    const latest = files[0];
    const filePath = path.join(backupDir, latest.name);
    const content = fs.readFileSync(filePath);
    const parsed = JSON.parse(content);

    console.log(`📤 Subiendo ${latest.name} a Vercel Blob...`);
    console.log(`   • ${parsed.data?.players?.length ?? 0} jugadores`);
    console.log(`   • ${parsed.data?.rankings?.length ?? 0} rankings`);
    console.log(`   • ${parsed.data?.clubs?.length ?? 0} clubes`);

    const blob = await put('backups/latest.json', content, {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
    });

    console.log(`\n✅ Backup disponible en Vercel Blob`);
    console.log(`   URL: ${blob.url}`);
    console.log(`   Tamaño: ${(content.length / 1024).toFixed(2)} KB\n`);
}

uploadLatestBackup().catch(err => {
    console.error('❌ Error subiendo a Blob:', err.message);
    if (err.message?.includes('BLOB_READ_WRITE_TOKEN')) {
        console.log('\n💡 Agrega BLOB_READ_WRITE_TOKEN a tu .env');
        console.log('   Encuéntralo en: Vercel Dashboard → Storage → tu blob store → .env.local');
    }
    process.exit(1);
});
