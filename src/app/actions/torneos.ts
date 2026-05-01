'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Tipos
interface Jugador {
  id: string
  nombre: string
  clubId: string
  ranking?: number
  torneoId?: string
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

/**
 * Genera el cuadro de partidos para la fase de ajuste
 */
export async function generarCuadroFaseAjuste(torneoId: string): Promise<ResultadoGeneracion> {
  try {
    console.log('🎯 Iniciando generación de cuadro para torneo:', torneoId)

    // 1. Verificar que el torneo existe
    const torneo = await prisma.tournament.findUnique({
      where: { id: torneoId }
    })

    if (!torneo) {
      return {
        success: false,
        error: 'Torneo no encontrado'
      }
    }

    // 2. Obtener todos los jugadores del torneo
    const jugadores = await (prisma as any).playerProfile.findMany({
      where: { tournamentId: torneoId },
      orderBy: { averageBase: 'desc' }
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
    const resultado = await prisma.match.createMany({
      data: partidos.map(p => ({
        tournamentId: p.torneoId,
        homePlayerId: p.jugador1Id,
        awayPlayerId: p.jugador2Id,
        round: p.grupo,
        matchOrder: 0
      })),
      skipDuplicates: true
    })

    console.log(`✅ Se crearon ${resultado.count} partidos`)

    // 5. Actualizar el estado del torneo
    await prisma.tournament.update({
      where: { id: torneoId },
      data: { 
        status: 'IN_PROGRESS' as any
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
  const jugadoresPorGrupo = 4
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
    const partidosPendientes = await prisma.match.findMany({
      where: {
        tournamentId: torneoId,
        homeScore: null
      }
    })

    if (partidosPendientes.length > 0) {
      return {
        success: false,
        error: `Hay ${partidosPendientes.length} partidos pendientes. Completa todos los partidos antes de cerrar el torneo.`
      }
    }

    // 2. Obtener todos los jugadores del torneo
    const jugadores = await (prisma as any).playerProfile.findMany({
      where: { tournamentId: torneoId }
    })

    // 3. Calcular puntos y actualizar rankings
    for (const jugador of jugadores) {
      const puntos = await calcularPuntosJugador(jugador.id, torneoId)
      
      // Actualizar o crear ranking nacional
      await prisma.ranking.upsert({
        where: { 
          playerId_discipline_category: {
            playerId: jugador.id,
            discipline: 'THREE_BAND',
            category: 'MASTER'
          }
        },
        update: {
          points: { increment: puntos },
          updatedAt: new Date()
        },
        create: {
          playerId: jugador.id,
          discipline: 'THREE_BAND',
          category: 'MASTER',
          points: puntos,
          updatedAt: new Date()
        }
      })
    }

    // 4. Cerrar el torneo
    await prisma.tournament.update({
      where: { id: torneoId },
      data: {
        status: 'FINISHED' as any,
        endDate: new Date()
      }
    })

    // 5. Revalidar páginas
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
  // Obtener todos los partidos del jugador en este torneo
  const partidos = await prisma.match.findMany({
    where: {
      tournamentId: torneoId,
      OR: [
        { homePlayerId: jugadorId },
        { awayPlayerId: jugadorId }
      ],
      NOT: { homeScore: null }
    }
  })

  let puntos = 0

  // Sistema de puntuación básico:
  // - Victoria: 3 puntos
  // - Derrota: 0 puntos
  // - Participación: 1 punto por partido jugado
  
  for (const partido of partidos) {
    // Punto por participación
    puntos += 1

    // Puntos adicionales por victoria
    if (partido.homePlayerId === jugadorId && (partido.homeScore || 0) > (partido.awayScore || 0)) {
      puntos += 3
    } else if (partido.awayPlayerId === jugadorId && (partido.awayScore || 0) > (partido.homeScore || 0)) {
      puntos += 3
    }
  }

  return puntos
}