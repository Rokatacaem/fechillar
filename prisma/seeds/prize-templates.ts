import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPrizeTemplates() {
  console.log('🏆 Creando plantillas de premios...');
  
  // Template estándar (8 lugares)
  await prisma.prizeTemplate.upsert({
    where: { id: 'default-8-places' },
    create: {
      id: 'default-8-places',
      name: 'Estándar 8 lugares',
      isDefault: true,
      distribution: [
        { position: 1, percentage: 35, label: 'Primer Lugar' },
        { position: 2, percentage: 25, label: 'Segundo Lugar' },
        { position: 3, percentage: 12, label: 'Tercer Lugar' },
        { position: 4, percentage: 12, label: 'Cuarto Lugar' },
        { position: 5, percentage: 4, label: 'Quinto Lugar' },
        { position: 6, percentage: 4, label: 'Sexto Lugar' },
        { position: 7, percentage: 4, label: 'Séptimo Lugar' },
        { position: 8, percentage: 4, label: 'Octavo Lugar' },
      ],
    },
    update: {
        distribution: [
            { position: 1, percentage: 35, label: 'Primer Lugar' },
            { position: 2, percentage: 25, label: 'Segundo Lugar' },
            { position: 3, percentage: 12, label: 'Tercer Lugar' },
            { position: 4, percentage: 12, label: 'Cuarto Lugar' },
            { position: 5, percentage: 4, label: 'Quinto Lugar' },
            { position: 6, percentage: 4, label: 'Sexto Lugar' },
            { position: 7, percentage: 4, label: 'Séptimo Lugar' },
            { position: 8, percentage: 4, label: 'Octavo Lugar' },
        ],
    },
  });

  console.log('✅ Plantillas de premios creadas.');
}

if (require.main === module) {
    seedPrizeTemplates()
      .catch((e) => {
        console.error('❌ Error en seed de premios:', e);
        process.exit(1);
      })
      .finally(async () => {
        await prisma.$disconnect();
      });
}
