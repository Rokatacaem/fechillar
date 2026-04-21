import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando registro de activación del Medallero Automático...");

  // Buscar si ya existe un log similar
  const existingLog = await prisma.auditLog.findFirst({
    where: {
      OR: [
        { action: { contains: "medal" } },
        { action: { contains: "medallero" } },
        { details: { contains: "medallero" } }
      ]
    }
  });

  if (existingLog) {
    console.log("✅ El sistema ya cuenta con un registro de activación:");
    console.log(JSON.stringify(existingLog, null, 2));
  } else {
    console.log("⚠️ Registro no encontrado. Procediendo a registrar activación mandatoria...");
    
    // Obtener un admin para asociar el log (usualmente el de sistema o el primero encontrado)
    const admin = await prisma.user.findFirst({
      where: { role: { in: ["SUPERADMIN", "FEDERATION_ADMIN"] } }
    });

    if (!admin) {
        console.error("❌ No se encontró un administrador para registrar la acción.");
        return;
    }

    const newLog = await prisma.auditLog.create({
      data: {
        action: "SYSTEM_ACTIVATION_MEDALLERO",
        userId: admin.id,
        details: JSON.stringify({
          feature: "Automatic Achievement Extraction (Medallero)",
          description: "Activación del motor de extracción de logros basado en estadísticas de partidos (Campeón, Subcampeón, High Run).",
          status: "SUCCESSFUL_DEPLOYMENT",
          timestamp: new Date().toISOString()
        })
      }
    });

    console.log("✅ Registro de activación creado exitosamente:");
    console.log(JSON.stringify(newLog, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
