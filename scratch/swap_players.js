const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tid = '1fa8fea1-4960-4eba-bf71-49fb8539e17d';
  
  // Buscar a los jugadores
  const regs = await prisma.tournamentRegistration.findMany({
    where: { tournamentId: tid },
    include: { player: true }
  });

  const victor = regs.find(r => (r.player.firstName + ' ' + r.player.lastName).includes('Victor Saavedra'));
  const edwin = regs.find(r => (r.player.firstName + ' ' + r.player.lastName).includes('Edwin Castillo'));

  if (victor && edwin) {
    // Mover a Victor a la lista de espera (al final, bajando sus puntos)
    await prisma.tournamentRegistration.update({
      where: { id: victor.id },
      data: { 
        isWaitingList: true, 
        status: 'PENDING',
        registeredPoints: -100 // Asegura que quede al fondo
      }
    });

    // Mover a Edwin al cuadro principal (subiendo sus puntos para que entre en los 54)
    await prisma.tournamentRegistration.update({
      where: { id: edwin.id },
      data: { 
        isWaitingList: false, 
        status: 'APPROVED',
        registeredPoints: 5000 // Asegura que entre en el top 54
      }
    });

    console.log('✅ Cambios realizados: Edwin Castillo al cuadro principal, Victor Saavedra a lista de espera.');
  } else {
    console.log('❌ Error: No se encontró a uno o ambos jugadores.');
    if (!victor) console.log('   - Victor Saavedra no encontrado');
    if (!edwin) console.log('   - Edwin Castillo no encontrado');
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
