"use client";

/**
 * Dashboard centralizado de gestión de torneo
 * Reemplaza la navegación fragmentada con una vista única y coherente
 * Ubicación: src/components/tournament/TournamentManager.tsx
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  GitMerge,
  Target,
  Trophy,
  Award,
  Crown,
  ChevronDown,
  ChevronRight,
  Printer,
  Plus,
  CheckCircle2,
  Lock,
  Loader2,
  Calendar,
  MapPin,
  User2,
} from "lucide-react";
import { generateKnockoutPhaseAction } from "@/app/(sgf)/tournaments/[id]/resultados/actions";
import { toast } from "sonner";
import { PrintPhasePlanillasButton } from "@/components/tournaments/PrintPhasePlanillasButton";
import { TournamentQR } from "@/components/tournaments/TournamentQR";

type PhaseStatus = "completed" | "active" | "locked";

interface Match {
  id: string;
  round: number;
  matchOrder: number;
  homePlayer?: { id: string; firstName: string; lastName: string; club?: { name: string } } | null;
  awayPlayer?: { id: string; firstName: string; lastName: string; club?: { name: string } } | null;
  winnerId?: string | null;
  homeScore?: number;
  awayScore?: number;
  isWO: boolean;
}

interface Group {
  id: string;
  name: string;
  order: number;
  matches: Match[];
  players: Array<{
    id: string;
    player: {
      firstName: string;
      lastName: string;
      club?: { name: string };
    };
  }>;
}

interface Phase {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  status: PhaseStatus;
  matchesCompleted: number;
  matchesTotal: number;
  description: string;
  groups?: Group[];
  matches?: Match[];
  canGenerate?: boolean;
}

interface TournamentManagerProps {
  tournamentId: string;
  tournamentName: string;
  discipline: string;
  venue: string;
  phases: Phase[];
  onGenerateBracket?: () => void | undefined;
}

export default function TournamentManager({
  tournamentId,
  tournamentName,
  discipline,
  venue,
  phases,
  onGenerateBracket,
}: TournamentManagerProps) {
  const router = useRouter();
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(["groups"]));
  const [isGenerating, setIsGenerating] = useState(false);

  const togglePhase = (id: string) => {
    const newSet = new Set(expandedPhases);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedPhases(newSet);
  };

  const handleGenerateKnockout = async () => {
    if (!tournamentId) return;
    
    setIsGenerating(true);
    const result = await generateKnockoutPhaseAction(tournamentId);
    setIsGenerating(false);

    if (result.success) {
      toast.success("Llaves de eliminación generadas correctamente");
      router.refresh();
    } else {
      toast.error(result.error || "Error al generar las llaves");
    }
  };

  const getPhaseIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Users,
      GitMerge,
      Target,
      Trophy,
      Award,
      Crown,
    };
    return icons[iconName] || Target;
  };

  const getStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case "completed":
        return "border-l-emerald-500 bg-emerald-500/5";
      case "active":
        return "border-l-amber-500 bg-amber-500/5";
      case "locked":
        return "border-l-slate-700 bg-slate-800/30";
    }
  };

  const getStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "active":
        return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
      case "locked":
        return <Lock className="w-5 h-5 text-slate-600" />;
    }
  };

  const renderMatchCard = (match: Match, index: number) => {
    const isCompleted = match.winnerId || match.isWO;
    const homeWon = match.winnerId === match.homePlayer?.id;
    const awayWon = match.winnerId === match.awayPlayer?.id;

    return (
      <div
        key={match.id}
        className={`
          p-3 rounded-lg border transition-all
          ${isCompleted ? "bg-slate-800/50 border-slate-700" : "bg-slate-900 border-slate-600 hover:border-amber-500"}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-500">Partido #{index + 1}</span>
          {!isCompleted && (
            <button 
              onClick={() => router.push(`/tournaments/${tournamentId}/resultados`)}
              className="text-xs px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-medium"
            >
              Cargar Resultado
            </button>
          )}
        </div>

        <div className="space-y-1">
          {/* Home Player */}
          <div
            className={`flex items-center justify-between p-2 rounded ${
              homeWon ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-slate-800/50"
            }`}
          >
            <div className="flex-1">
              <p className={`text-sm ${homeWon ? "font-bold text-emerald-400" : "text-white"}`}>
                {match.homePlayer
                  ? `${match.homePlayer.firstName} ${match.homePlayer.lastName}`
                  : "Por definir"}
              </p>
              {match.homePlayer?.club && (
                <p className="text-xs text-slate-400">{match.homePlayer.club.name}</p>
              )}
            </div>
            {isCompleted && (
              <span className={`text-lg font-bold ${homeWon ? "text-emerald-400" : "text-slate-500"}`}>
                {match.homeScore ?? 0}
              </span>
            )}
          </div>

          {/* Away Player */}
          <div
            className={`flex items-center justify-between p-2 rounded ${
              awayWon ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-slate-800/50"
            }`}
          >
            <div className="flex-1">
              <p className={`text-sm ${awayWon ? "font-bold text-emerald-400" : "text-white"}`}>
                {match.awayPlayer
                  ? `${match.awayPlayer.firstName} ${match.awayPlayer.lastName}`
                  : "Por definir"}
              </p>
              {match.awayPlayer?.club && (
                <p className="text-xs text-slate-400">{match.awayPlayer.club.name}</p>
              )}
            </div>
            {isCompleted && (
              <span className={`text-lg font-bold ${awayWon ? "text-emerald-400" : "text-slate-500"}`}>
                {match.awayScore ?? 0}
              </span>
            )}
          </div>
        </div>

        {match.isWO && (
          <p className="text-xs text-amber-400 mt-2 text-center">W.O.</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => router.push("/tournaments")}
          className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 text-sm"
        >
          ← Volver a torneos
        </button>

        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{tournamentName}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                {discipline}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {venue}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <TournamentQR 
              tournamentId={tournamentId} 
              tournamentName={tournamentName}
              size={100}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/api/tournaments/${tournamentId}/documents/bases`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-slate-500 shadow-lg active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-500" />
              BASES DEL TORNEO
            </a>
            <a
              href={`/api/tournaments/${tournamentId}/documents/sheets?phaseId=groups`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-slate-500 shadow-lg active:scale-95"
            >
              <Printer className="w-4 h-4 text-amber-500" />
              PLANILLAS GRUPOS
            </a>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="max-w-7xl mx-auto space-y-4">
        {phases.map((phase, index) => {
          const Icon = getPhaseIcon(phase.iconName);
          const isExpanded = expandedPhases.has(phase.id);
          const isClickable = phase.status !== "locked";

          return (
            <div
              key={phase.id}
              className={`
                border-l-4 rounded-lg overflow-hidden transition-all
                ${getStatusColor(phase.status)}
              `}
            >
              {/* Phase Header */}
              <button
                onClick={() => isClickable && togglePhase(phase.id)}
                disabled={!isClickable}
                className={`
                  w-full p-4 flex items-center justify-between
                  ${isClickable ? "hover:bg-white/5 cursor-pointer" : "cursor-not-allowed"}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Number Badge */}
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-400">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="p-2 rounded-lg bg-black/30">
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Name and Status */}
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {phase.name}
                      {getStatusIcon(phase.status)}
                    </h3>
                    <p className="text-sm text-slate-400">{phase.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress */}
                  {phase.matchesTotal > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-mono text-white">
                        {phase.matchesCompleted}/{phase.matchesTotal}
                      </p>
                      <div className="w-24 h-1.5 bg-black/30 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full transition-all ${
                            phase.status === "completed"
                              ? "bg-emerald-500"
                              : phase.status === "active"
                              ? "bg-amber-500"
                              : "bg-slate-700"
                          }`}
                          style={{
                            width: `${(phase.matchesCompleted / phase.matchesTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expand Icon */}
                  {isClickable &&
                    (isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    ))}
                </div>
              </button>

              {/* Phase Content */}
              {isExpanded && isClickable && (
                <div className="p-4 bg-black/20 border-t border-slate-800">
                  <div className="flex justify-end mb-4">
                    <PrintPhasePlanillasButton 
                      tournamentId={tournamentId} 
                      phaseName={phase.name} 
                      className="bg-slate-800 border-white/5 hover:bg-slate-700 text-slate-200"
                    />
                  </div>

                  {/* Generate Button for Adjustment Phase */}
                  {phase.canGenerate && (
                    <button
                      onClick={handleGenerateKnockout}
                      disabled={isGenerating}
                      className="w-full mb-4 px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold flex items-center justify-center gap-3 transition-colors"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      {isGenerating ? "GENERANDO LLAVES..." : "GENERAR LLAVES DE ELIMINACIÓN"}
                    </button>
                  )}

                  {/* Global repair for empty groups */}
                  {phase.groups && phase.groups.length > 0 && phase.groups.some(g => g.matches.length === 0) && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-full text-indigo-400">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Grupos sin partidas detectados</p>
                          <p className="text-slate-400 text-sm">Se han encontrado grupos con jugadores pero sin encuentros generados.</p>
                        </div>
                      </div>
                      <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        onClick={async () => {
                          if (confirm("¿Generar partidas para TODOS los grupos faltantes?")) {
                            const { generateMatchesByGroup } = await import("@/app/(sgf)/tournaments/[id]/resultados/actions");
                            const res = await generateMatchesByGroup(tournamentId);
                            if (res.success) {
                              alert(`Se generaron ${res.matchesGenerated} partidas en total.`);
                              window.location.reload();
                            } else {
                              alert("Error: " + res.error);
                            }
                          }
                        }}
                      >
                        Reparar Todos los Grupos
                      </button>
                    </div>
                  )}

                  {/* Groups View */}
                  {phase.groups && phase.groups.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {phase.groups.map((group) => (
                        <div key={group.id} className="bg-slate-900 rounded-lg p-4 border border-slate-700 flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-white">{group.name}</h4>
                                <p className="text-[9px] text-slate-500 uppercase font-black">Turno {group.name.match(/\((T\d)\)/)?.[1] || "N/A"}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                                  {group.matches.length} Partidas
                                </span>
                                <TournamentQR 
                                    tournamentId={tournamentId} 
                                    tournamentName={tournamentName}
                                    showLabel={false}
                                    size={24}
                                    groupName={group.name}
                                    standingsSummary={(() => {
                                        // Cálculo rápido de 1° y 2° para el reporte
                                        const stats: Record<string, any> = {};
                                        
                                        // Seguridad: Verificar existencia de arreglos
                                        const players = group.players || [];
                                        const matches = group.matches || [];

                                        players.forEach((p: any) => {
                                            stats[p.id] = { id: p.id, name: p.player?.lastName || "N/A", pts: 0 };
                                        });

                                        matches.forEach((m: any) => {
                                            if (m.winnerId) {
                                                if (stats[m.homePlayerId]) stats[m.homePlayerId].pts += (m.winnerId === m.homePlayerId ? 2 : 0);
                                                if (stats[m.awayPlayerId]) stats[m.awayPlayerId].pts += (m.winnerId === m.awayPlayerId ? 2 : 0);
                                            }
                                        });
                                        const sorted = Object.values(stats).sort((a: any, b: any) => {
                                            if (b.pts !== a.pts) return b.pts - a.pts;
                                            // Duelo Directo Simplificado
                                            const h2h = matches.find((m: any) => 
                                                (m.homePlayerId === a.id && m.awayPlayerId === b.id) ||
                                                (m.homePlayerId === b.id && m.awayPlayerId === a.id)
                                            );
                                            if (h2h?.winnerId === a.id) return -1;
                                            if (h2h?.winnerId === b.id) return 1;
                                            return 0;
                                        });
                                        return `1° ${sorted[0]?.name || "?"}, 2° ${sorted[1]?.name || "?"}`;
                                    })()}
                                />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {/* Mostrar partidas si existen */}
                            {group.matches.length > 0 ? (
                              <>
                                {group.matches.slice(0, 3).map((match, idx) => renderMatchCard(match, idx))}
                                {group.matches.length > 3 && (
                                  <button
                                    className="w-full text-sm text-slate-400 hover:text-white py-2"
                                    onClick={() => router.push(`/tournaments/${tournamentId}/grupos`)}
                                  >
                                    Ver {group.matches.length - 3} partidas más →
                                  </button>
                                )}
                              </>
                            ) : (
                              /* Mostrar jugadores si no hay partidas */
                              <div className="space-y-1 py-1">
                                {group.registrations?.map((reg: any, rIdx: number) => (
                                  <div key={reg.playerId} className="text-sm text-slate-400 flex items-center gap-2">
                                    <span className="text-slate-600 w-4">{rIdx + 1}.</span>
                                    <span className="truncate">{reg.player.firstName} {reg.player.lastName}</span>
                                  </div>
                                ))}
                                {(!group.registrations || group.registrations.length === 0) && (
                                  <p className="text-xs text-rose-500 italic">Sin jugadores asignados</p>
                                )}
                                <button
                                  className="w-full mt-2 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 py-2 rounded border border-indigo-500/20 transition-colors"
                                  onClick={async () => {
                                    if (confirm("¿Generar partidas para este grupo?")) {
                                      const { generateMatchesByGroup } = await import("@/app/(sgf)/tournaments/[id]/resultados/actions");
                                      const res = await generateMatchesByGroup(tournamentId);
                                      if (res.success) {
                                        alert(`Se generaron ${res.matchesGenerated} partidas.`);
                                        router.refresh();
                                      } else {
                                        alert("Error: " + res.error);
                                      }
                                    }
                                  }}
                                >
                                  Generar Partidas
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bracket Matches */}
                  {phase.matches && phase.matches.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {phase.matches.map((match, idx) => renderMatchCard(match, idx))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!phase.groups?.length && !phase.matches?.length && (
                    <p className="text-center text-slate-500 py-8">
                      Esta fase aún no tiene partidas generadas
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
