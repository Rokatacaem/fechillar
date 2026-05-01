'use server'

import { revalidatePath } from 'next/cache'

// Tipos
interface Jugador {
  id: string
  nombre: string
  clubId: string
  ranking?: number
}

interface Partido {
  jugador1Id: string
  jugador2Id: string
  fase: string
  grupo: number
  torneoId: string
}

interface ResultadoGeneracion {
  success: boolean
  error?: string
  partidosCreados?: number
}

// Simulación de Prisma - REEMPLAZAR con tu conexión real
// import { prisma } from '@/lib/prisma'

// Mock temporal - eliminar cuando conectes Prisma real
const mockPrisma = {
  jugador: {
    findMany: async (params: any) => {
      // Retorna jugadores de ejemplo
      return [
        { id: '1', nombre: 'Juan Carlos Johnson', clubId: 'club1', ranking: 1500 },
        { id: '2', nombre: 'Luis Bahamondes', clubId: 'club2', ranking: 1600 },
        { id: '3', nombre: 'Mario Diaz', clubId: 'club1', ranking: 1450 },
        { id: '4', nombre: 'Ricardo Alfaro', clubId: 'club3', ranking: 1550 },
      ]
    }
  },
  partido: {
    createMany: async (params: any) => {
      console.log('Creando partidos:', params.data.length)
      return { count: params.data.length }
    },
    findMany: async (params: any) => {
      return []
    }
  },
  torneo: {
    update: async (params: any) => {
      console.log('Actualizando torneo:', params)
      return { id: params.where.id, estado: params.data.estado }
    },
    findUnique: async (params: any) => {
      return {
        id: params.where.id,
        nombre: 'Torneo Nacional',
        estado: 'activo'
      }
    }
  },
  ranking: {
    upsert: async (params: any) => {
      console.log('Actualizando ranking:', params)
      return { id: '1', ...params.create }
    }
  }
}

/**
 * Genera el cuadro de partidos para la fase de ajuste
 */
export async function generarCuadroFaseAjuste(torneoId: string): Promise<ResultadoGeneracion> {
  try {
    console.log('🎯 Iniciando generación de cuadro para torneo:', torneoId)

    // 1. Verificar que el torneo existe
    const torneo = await mockPrisma.torneo.findUnique({
      where: { id: torneoId }
    })

    if (!torneo) {
      return {
        success: false,
        error: 'Torneo no encontrado'
      }
    }

    // 2. Obtener todos los jugadores del torneo
    const jugadores = await mockPrisma.jugador.findMany({
      where: { torneoId },
      orderBy: { ranking: 'desc' }
    })

    if (jugadores.length < 2) {
      return {
        success: false,
        error: 'Se necesitan al menos 2 jugadores para generar el cuadro'
      }
    }

    console.log(`📊 Se encontraron ${jugadores.length} jugadores`)

    // 3. Generar los partidos por grupos
    const partidos = generarPartidosPorGrupos(jugadores, torneoId)

    // 4. Guardar los partidos en la base de datos
    const resultado = await mockPrisma.partido.createMany({
      data: partidos,
      skipDuplicates: true // Evita duplicados si ya existen
    })

    console.log(`✅ Se crearon ${resultado.count} partidos`)

    // 5. Actualizar el estado del torneo
    await mockPrisma.torneo.update({
      where: { id: torneoId },
      data: { 
        estado: 'fase_grupos',
        faseActual: 'grupos'
      }
    })

    // 6. Revalidar la página para mostrar cambios
    revalidatePath('/torneos')

    return {
      success: true,
      partidosCreados: resultado.count
    }

  } catch (error) {
    console.error('❌ Error al generar cuadro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Genera partidos organizados por grupos
 */
function generarPartidosPorGrupos(jugadores: Jugador[], torneoId: string): Partido[] {
  const partidos: Partido[] = []
  const jugadoresPorGrupo = 4 // Ajustar según necesites
  const numeroGrupos = Math.ceil(jugadores.length / jugadoresPorGrupo)

  console.log(`🎲 Generando ${numeroGrupos} grupos`)

  // Dividir jugadores en grupos
  for (let grupo = 0; grupo < numeroGrupos; grupo++) {
    const inicio = grupo * jugadoresPorGrupo
    const fin = Math.min(inicio + jugadoresPorGrupo, jugadores.length)
    const jugadoresGrupo = jugadores.slice(inicio, fin)

    // Generar partidos round-robin dentro del grupo
    for (let i = 0; i < jugadoresGrupo.length; i++) {
      for (let j = i + 1; j < jugadoresGrupo.length; j++) {
        partidos.push({
          jugador1Id: jugadoresGrupo[i].id,
          jugador2Id: jugadoresGrupo[j].id,
          fase: 'grupos',
          grupo: grupo + 1,
          torneoId
        })
      }
    }
  }

  return partidos
}

/**
 * Cierra el torneo y publica los rankings
 */
export async function cerrarTorneoYPublicarRankings(torneoId: string): Promise<ResultadoGeneracion> {
  try {
    console.log('🏆 Cerrando torneo:', torneoId)

    // 1. Verificar que todos los partidos están completos
    const partidosPendientes = await mockPrisma.partido.findMany({
      where: {
        torneoId,
        completado: false
      }
    })

    if (partidosPendientes.length > 0) {
      return {
        success: false,
        error: `Hay ${partidosPendientes.length} partidos pendientes. Completa todos los partidos antes de cerrar el torneo.`
      }
    }

    // 2. Calcular puntos y actualizar rankings
    const jugadores = await mockPrisma.jugador.findMany({
      where: { torneoId }
    })

    for (const jugador of jugadores) {
      // Calcular puntos del jugador (implementar lógica según tu sistema)
      const puntos = await calcularPuntosJugador(jugador.id, torneoId)
      
      // Actualizar ranking nacional
      await mockPrisma.ranking.upsert({
        where: { jugadorId: jugador.id },
        update: {
          puntos: { increment: puntos },
          ultimaActualizacion: new Date()
        },
        create: {
          jugadorId: jugador.id,
          puntos,
          ultimaActualizacion: new Date()
        }
      })
    }

    // 3. Cerrar el torneo
    await mockPrisma.torneo.update({
      where: { id: torneoId },
      data: {
        estado: 'cerrado',
        fechaCierre: new Date()
      }
    })

    // 4. Revalidar
    revalidatePath('/torneos')
    revalidatePath('/rankings')

    console.log('✅ Torneo cerrado y rankings publicados')

    return {
      success: true
    }

  } catch (error) {
    console.error('❌ Error al cerrar torneo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Calcula los puntos de un jugador en el torneo
 */
async function calcularPuntosJugador(jugadorId: string, torneoId: string): Promise<number> {
  // Implementar lógica de cálculo de puntos según tu sistema
  // Ejemplo básico:
  const partidos = await mockPrisma.partido.findMany({
    where: {
      torneoId,
      OR: [
        { jugador1Id: jugadorId },
        { jugador2Id: jugadorId }
      ]
    }
  })

  let puntos = 0
  // Sumar puntos por victorias, participación, etc.
  // Este es solo un ejemplo, ajustar según tu sistema de puntuación

  return puntos
}
