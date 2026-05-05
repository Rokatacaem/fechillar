const fs = require('fs');
const path = require('path');

async function sync() {
    const backupPath = path.join(process.cwd(), "backups", "backup-2026-04-30T04-17-19.json");
    const vercelUrl = "https://fechillar-three.vercel.app/api/admin/restore-backup";

    if (!fs.existsSync(backupPath)) {
        console.error("❌ No se encontró el archivo de backup en:", backupPath);
        return;
    }

    console.log("🚀 Leyendo backup local...");
    const fileContent = fs.readFileSync(backupPath, "utf-8");
    const backupData = JSON.parse(fileContent);

    console.log(`📤 Enviando ${backupData.data.players.length} jugadores a Vercel...`);

    try {
        const response = await fetch(vercelUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backupData),
        });

        const result = await response.json();

        if (response.ok) {
            console.log("✅ ¡Sincronización Exitosa!");
            console.log("Resumen:", result.message);
            console.log("Estadísticas:", result.stats);
        } else {
            console.error("❌ Error en la sincronización:", result.error);
        }
    } catch (error) {
        console.error("❌ Error de red conectando con Vercel:", error.message);
    }
}

sync();
