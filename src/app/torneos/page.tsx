'use client'

import { useState } from 'react'
import { generarCuadroFaseAjuste, cerrarTorneoYPublicarRankings } from '@/src/app/actions/torneos'

interface Partido {
  id: string
  jugador1: string
  club1: string
  puntaje1: number
  jugador2: string
  club2: string
  puntaje2: number
  completado: boolean
}

interface Torneo {
  id: string
  nombre: string
  estado: string
  jugadores: number
  pendientes: number
}

export default function TorneosPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Datos de ejemplo - reemplazar con datos reales de tu API
  const torneo: Torneo = {
    id: 'torneo-1',
    nombre: 'Torneo Nacional',
    estado: 'activo',
    jugadores: 33,
    pendientes: 0
  }

  const partidos: Partido[] = [
    {
      id: '1',
      jugador1: 'JUAN CARLOS JOHNSON',
      club1: 'Club de Billar Valparaíso',
      puntaje1: 7,
      jugador2: 'LUIS BAHAMONDES',
      club2: 'Club La Calera',
      puntaje2: 28,
      completado: true
    },
    {
      id: '2',
      jugador1: 'JUAN CARLOS JOHNSON',
      club1: 'Club de Billar Valparaíso',
      puntaje1: 16,
      jugador2: 'MARIO DIAZ',
      club2: 'Club de Billar Valparaíso',
      puntaje2: 19,
      completado: true
    },
    {
      id: '3',
      jugador1: 'LUIS BAHAMONDES',
      club1: 'Club La Calera',
      puntaje1: 28,
      jugador2: 'MARIO DIAZ',
      club2: 'Club de Billar Valparaíso',
      puntaje2: 10,
      completado: true
    }
  ]

  const handleGenerarCuadro = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const result = await generarCuadroFaseAjuste(torneo.id)

      if (result.success) {
        setSuccess('¡Cuadro generado exitosamente!')
        // Recargar la página o actualizar datos
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setError(result.error || 'Error al generar el cuadro')
      }
    } catch (err) {
      setError('Error inesperado al generar el cuadro')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCerrarTorneo = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const result = await cerrarTorneoYPublicarRankings(torneo.id)

      if (result.success) {
        setSuccess('¡Torneo cerrado y rankings publicados!')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setError(result.error || 'Error al cerrar el torneo')
      }
    } catch (err) {
      setError('Error inesperado al cerrar el torneo')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">SGF | FECHILLAR</h1>
          <p className="text-gray-400">Gestión de Torneos - Federación</p>
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo */}
          <div className="space-y-6">
            {/* Info del torneo */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-yellow-400 text-sm">⚠️ Pendientes</span>
                <span className="text-yellow-400 text-2xl font-bold">{torneo.pendientes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">👥 Jugadores</span>
                <span className="text-white text-2xl font-bold">{torneo.jugadores}</span>
              </div>
              <div className="mt-4 bg-green-500 h-2 rounded-full">
                <div className="h-full bg-green-400 rounded-full" style={{width: '100%'}}></div>
              </div>
              <p className="text-gray-400 text-xs mt-2 text-center">100% completado</p>
            </div>

            {/* Advertencia */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-yellow-400">⚠️</span>
                <p className="text-yellow-200 text-sm">
                  Torneo NACIONAL sin homologar: Al cerrar, los puntos se acreditarán en forma retroactiva en el Ranking Nacional.
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <button
              onClick={handleGenerarCuadro}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none shadow-lg"
            >
              {loading ? '⏳ GENERANDO...' : '🎯 GENERAR CUADRO (FASE AJUSTE)'}
            </button>

            <button
              onClick={handleCerrarTorneo}
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none shadow-lg"
            >
              {loading ? '⏳ PROCESANDO...' : '🏆 CERRAR TORNEO Y PUBLICAR RANKINGS'}
            </button>
          </div>

          {/* Panel derecho - Partidos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fase de Grupos 2 */}
            <div>
              <h2 className="text-green-400 text-sm font-bold mb-4 uppercase tracking-wider">
                Fase de Grupos: 2
              </h2>
              <div className="space-y-3">
                {partidos.map((partido) => (
                  <div
                    key={partido.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-white">{partido.jugador1}</div>
                        <div className="text-gray-400 text-sm">{partido.club1}</div>
                      </div>
                      <div className="text-center px-6">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-white">{partido.puntaje1}</span>
                          <span className="text-gray-500">vs</span>
                          <span className="text-2xl font-bold text-green-400">{partido.puntaje2}</span>
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-bold text-white">{partido.jugador2}</div>
                        <div className="text-gray-400 text-sm">{partido.club2}</div>
                      </div>
                      {partido.completado && (
                        <div className="ml-4">
                          <span className="text-green-400 text-xl">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fase de Grupos 3 */}
            <div>
              <h2 className="text-green-400 text-sm font-bold mb-4 uppercase tracking-wider">
                Fase de Grupos: 3
              </h2>
              <div className="space-y-3">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-white">FERNANDO RAMIREZ</div>
                      <div className="text-gray-400 text-sm">Club La Calera</div>
                    </div>
                    <div className="text-center px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-white">7</span>
                        <span className="text-gray-500">vs</span>
                        <span className="text-2xl font-bold text-green-400">26</span>
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-bold text-white">CARLOS GUERRA</div>
                      <div className="text-gray-400 text-sm">Club de Billar Valparaíso</div>
                    </div>
                    <div className="ml-4">
                      <span className="text-green-400 text-xl">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

