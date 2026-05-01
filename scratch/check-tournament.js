const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Buscar por ID específico
  const t = await p.tournament.findUnique({ 
    where: { id: '8c969055-3d4e-4471-8d2c-1e79246de3a7' },
    select: { id: true, name: true, tenantId: true, status: true }
  });
  
  console.log('--- RESULTADO ---');
  if (!t) {
    console.log('❌ NO EXISTE ese ID en la base de datos.');
    console.log('Listando todos los torneos disponibles:');
    const todos = await p.tournament.findMany({ 
      select: { id: true, name: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    todos.forEach(x => console.log(`  - ${x.id} | ${x.name} | ${x.status}`));
  } else {
    console.log('✅ TORNEO ENCONTRADO:', t.name);
    console.log('   tenantId:', t.tenantId);
    console.log('   status:', t.status);
    
    // Contar partidas eliminatorias (groupId null)
    const matches = await p.match.count({
      where: { tournamentId: t.id, groupId: null }
    });
    console.log('   Partidas bracket (groupId:null):', matches);
  }
}

main().catch(console.error).finally(() => p.$disconnect());
