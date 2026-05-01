// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.partido.deleteMany()
  await prisma.jugador.deleteMany()
  await prisma.torneo.deleteMany()
  await prisma.club.deleteMany()
  await prisma.ranking.deleteMany()

  console.log('🗑️  Datos antiguos eliminados')

  // Crear clubes
  const clubValparaiso = await prisma.club.create({
    data: {
      nombre: 'Club de Billar Valparaíso',
      ciudad: 'Valparaíso',
      region: 'Valparaíso'
    }
  })

  const clubCalera = await prisma.club.create({
    data: {
      nombre: 'Club La Calera',
      ciudad: 'La Calera',
      region: 'Valparaíso'
    }
  })

  const clubSanMiguel = await prisma.club.create({
    data: {
      nombre: 'Club San Miguel',
      ciudad: 'San Miguel',
      region: 'Metropolitana'
    }
  })

  console.log('🏢 Clubes creados')

  // Crear torneo
  const torneo = await prisma.torneo.create({
    data: {
      nombre: 'Torneo Nacional 2026',
      descripcion: 'Torneo nacional de billar, primera fecha',
      tipo: 'NACIONAL',
      estado: 'activo',
      homologado: false,
      fechaInicio: new Date('2026-04-01')
    }
  })

  console.log('🏆 Torneo creado')

  // Crear jugadores
  const jugadores = await Promise.all([
    prisma.jugador.create({
      data: {
        nombre: 'Juan Carlos Johnson',
        email: 'jjohnson@example.com',
        ranking: 1500,
        torneoId: torneo.id,
        clubId: clubValparaiso.id
      }
    }),
    prisma.jugador.create({
      data: {
        nombre: 'Luis Bahamondes',
        email: 'lbahamondes@example.com',
        ranking: 1650,
        torneoId: torneo.id,
        clubId: clubCalera.id
      }
    }),
    prisma.jugador.create({
      data: {
        nombre: 'Mario Diaz',
        email: 'mdiaz@example.com',
        ranking: 1450,
        torneoId: torneo.id,
        clubId: clubValparaiso.id
      }
    }),
    prisma.jugador.create({
      data: {
        nombre: 'Ricardo Alfaro',
        email: 'ralfaro@example.com',
        ranking: 1550,
        torneoId: torneo.id,
        clubId: clubSanMiguel.id
      }
    }),
    prisma.jugador.create({
      data: {
        nombre: 'Bladimir Arenas',
        email: 'barenas@example.com',
        ranking: 1600,
        torneoId: torneo.id,
        clubId: clubSanMiguel.id
      }
    }),
    prisma.jugador.create({
      data: {
        nombre: 'Jamir Genaro',
        email: 'jgenaro@example.com',
        ranking: 1520,
        torneoId: torneo.id,
        clubId: clubSanMiguel.id
      }
    }),
    prisma.jugador.create({
      data: {
        nombre: 'Fernando Ramirez',
        email: 'framirez@example.com',
        ranking: 1480,
        torneoId: torneo.id,
        clubId: clubCalera.id
      }
    }),
    prisma.jugador.create({
      data: {
        nombre: 'Carlos Guerra',
        email: 'cguerra@example.com',
        ranking: 1620,
        torneoId: torneo.id,
        clubId: clubValparaiso.id
      }
    }),
    prisma.jugador.create({
      data: {
        nombre: 'Rogelio Orozco',
        email: 'rorozco@example.com',
        ranking: 1530,
        torneoId: torneo.id,
        clubId: clubValparaiso.id
      }
    })
  ])

  console.log(`👥 ${jugadores.length} jugadores creados`)

  // Crear algunos partidos de ejemplo
  const partidos = await Promise.all([
    prisma.partido.create({
      data: {
        torneoId: torneo.id,
        jugador1Id: jugadores[0].id, // Juan Carlos
        jugador2Id: jugadores[1].id, // Luis
        puntaje1: 7,
        puntaje2: 28,
        fase: 'grupos',
        grupo: 1,
        completado: true,
        fechaJuego: new Date('2026-04-15')
      }
    }),
    prisma.partido.create({
      data: {
        torneoId: torneo.id,
        jugador1Id: jugadores[0].id, // Juan Carlos
        jugador2Id: jugadores[2].id, // Mario
        puntaje1: 16,
        puntaje2: 19,
        fase: 'grupos',
        grupo: 1,
        completado: true,
        fechaJuego: new Date('2026-04-16')
      }
    }),
    prisma.partido.create({
      data: {
        torneoId: torneo.id,
        jugador1Id: jugadores[1].id, // Luis
        jugador2Id: jugadores[2].id, // Mario
        puntaje1: 28,
        puntaje2: 10,
        fase: 'grupos',
        grupo: 1,
        completado: true,
        fechaJuego: new Date('2026-04-17')
      }
    })
  ])

  console.log(`🎯 ${partidos.length} partidos de ejemplo creados`)

  // Crear rankings iniciales
  for (const jugador of jugadores) {
    await prisma.ranking.create({
      data: {
        jugadorId: jugador.id,
        puntos: jugador.ranking,
        ultimaActualizacion: new Date()
      }
    })
  }

  console.log('📊 Rankings iniciales creados')

  console.log('\n✅ Seed completado exitosamente!\n')
  console.log('📝 Resumen:')
  console.log(`   - ${3} clubes`)
  console.log(`   - ${1} torneo`)
  console.log(`   - ${jugadores.length} jugadores`)
  console.log(`   - ${partidos.length} partidos`)
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
