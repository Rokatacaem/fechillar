import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Iniciando Escáner de Duplicados...");

    // 1. Encontrar al Administrador Maestro
    const mainAdmin = await prisma.user.findFirst({
        where: { role: "SUPERADMIN" },
        include: { playerProfile: true }
    });

    if (!mainAdmin) {
        console.log("❌ No se encontró el SuperAdmin principal.");
        return;
    }

    console.log(`✅ Admin Maestro detectado: ${mainAdmin.email}`);

    // 2. Buscar posibles perfiles duplicados de Rodrigo
    const duplicates = await prisma.playerProfile.findMany({
        where: {
            OR: [
                { user: { name: { contains: "RODRIGO", mode: "insensitive" } } },
                { rut: mainAdmin.playerProfile?.rut || "N/A" }
            ],
            NOT: { userId: mainAdmin.id }
        },
        include: { user: true }
    });

    if (duplicates.length === 0) {
        console.log("🎉 No se detectaron duplicados externos para el admin.");
        return;
    }

    console.log(`⚠️ Se encontraron ${duplicates.length} perfiles duplicados.`);

    for (const dup of duplicates) {
        console.log(`- Procesando duplicado: ${dup.user.name} (${dup.user.email})`);
        
        // Transferencia de datos si fuera necesario (Ranking, etc)
        // Por seguridad, vinculamos los rankings al admin principal antes de borrar
        await prisma.ranking.updateMany({
            where: { playerId: dup.id },
            data: { playerId: mainAdmin.playerProfile?.id || "" }
        });

        // Borrar el perfil y el usuario duplicado
        await prisma.user.delete({
            where: { id: dup.userId }
        });

        console.log(`✅ Duplicado ${dup.user.email} eliminado y saneado.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
