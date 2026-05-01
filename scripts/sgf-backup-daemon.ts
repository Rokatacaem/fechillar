import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/**
 * SGF BACKUP DAEMON
 * Script para automatizar respaldos de la base de datos en formato JSON.
 * Uso: npx ts-node scripts/sgf-backup-daemon.ts
 */

const prisma = new PrismaClient();

async function runBackup() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Iniciando respaldo programado...`);
    
    try {
        const [users, players, clubs, tournaments] = await Promise.all([
            prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } }),
            prisma.playerProfile.findMany(),
            prisma.club.findMany(),
            prisma.tournament.findMany()
        ]);

        const backupData = {
            version: "SGF-AUTO-BACKUP-V1",
            timestamp: timestamp,
            data: {
                users,
                players,
                clubs,
                tournaments
            }
        };

        const backupDir = path.join(process.cwd(), "backups", "auto");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const dateStr = timestamp.split('T')[0];
        const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        const fileName = `AUTO_BACKUP_${dateStr}_${timeStr}.json`;
        const filePath = path.join(backupDir, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
        console.log(`[SUCCESS] Respaldo guardado exitosamente en: ${filePath}`);

        // Limpieza: Mantener solo los últimos 7 respaldos automáticos
        const files = fs.readdirSync(backupDir).sort();
        if (files.length > 7) {
            const filesToDelete = files.slice(0, files.length - 7);
            filesToDelete.forEach(file => {
                fs.unlinkSync(path.join(backupDir, file));
                console.log(`[CLEANUP] Respaldo antiguo eliminado: ${file}`);
            });
        }

    } catch (error) {
        console.error("[ERROR] Fallo crítico en el respaldo automático:", error);
    }
}

// Configuración de intervalo (Default: 24 horas)
const INTERVAL_HOURS = 24;
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000; 

console.log("==========================================");
console.log("   SGF BACKUP DAEMON V1.0 - ACTIVADO      ");
console.log(`   Frecuencia: Cada ${INTERVAL_HOURS} horas             `);
console.log("==========================================");

runBackup(); 
setInterval(runBackup, INTERVAL_MS);
