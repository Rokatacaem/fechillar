import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * OPERACIÓN PAÑO LIMPIO: REINICIO TOTAL DEL SISTEMA
 * 
 * Este script elimina toda la data transaccional y estructural de prueba.
 * Preserva el usuario admin@fechillar.cl para no perder acceso.
 */
async function main() {
  console.log('--- INICIANDO OPERACIÓN PAÑO LIMPIO ---')

  try {
    // 1. Limpieza de Torneos y Registros relacionados
    console.log('Limpiando Torneos y Partidos...')
    await prisma.match.deleteMany()
    await prisma.tournamentGroup.deleteMany()
    await prisma.tournamentPhase.deleteMany()
    await prisma.tournamentPhoto.deleteMany()
    await prisma.tournamentRegistration.deleteMany()
    await prisma.tournamentEnrollment.deleteMany()
    await prisma.waitingList.deleteMany()
    await prisma.tournamentAssignment.deleteMany()
    await prisma.tournament.deleteMany()

    // 2. Limpieza de Jugadores y Perfiles
    console.log('Limpiando Perfiles de Jugadores y Rankings...')
    await prisma.ranking.deleteMany()
    await prisma.rankingSnapshot.deleteMany()
    await prisma.playerProfile.deleteMany()

    // 3. Limpieza de Auditoría y Finanzas
    console.log('Limpiando Auditoría y Finanzas...')
    await prisma.auditLog.deleteMany()
    await prisma.financeRecord.deleteMany()
    await prisma.membership.deleteMany()
    await prisma.workflowRequest.deleteMany()
    await prisma.transferRequest.deleteMany()

    // 4. Limpieza de Clubes (incluyendo directiva si existiera)
    console.log('Limpiando Clubes...')
    // En el nuevo esquema ClubMember tiene onDelete: Cascade, así que se borran con el club
    await prisma.club.deleteMany()

    // 5. Usuarios (Preservando solo al admin)
    console.log('Limpiando Usuarios (Preservando Admin)...')
    await prisma.user.deleteMany({
      where: {
        NOT: {
          email: 'admin@fechillar.cl'
        }
      }
    })

    console.log('✅ OPERACIÓN COMPLETADA: Mesa Limpia.')
  } catch (err) {
    console.error('❌ ERROR DURANTE LA LIMPIEZA:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
