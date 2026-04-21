import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🛠️ Asegurando integridad del Usuario Maestro...");
    
    const adminEmail = "admin@fechillar.cl";
    
    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: UserRole.SUPERADMIN,
            name: "Administrador SGF",
        },
        create: {
            email: adminEmail,
            name: "Administrador SGF",
            role: UserRole.SUPERADMIN,
            // Nota: La contraseña debe establecerse vía Auth.js si usas credenciales, 
            // pero esto asegura el registro en la DB.
        }
    });

    console.log(`✅ Usuario ${user.email} verificado y asegurado con rol ${user.role}`);
}

main()
    .catch((e) => {
        console.error("❌ Error asegurando admin:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
