"use client";

/**
 * Banner de navegación de fases del torneo
 * Muestra todas las fases desde el inicio, habilitándose progresivamente
 * Ubicación: src/components/tournament/TournamentPhaseNavigator.tsx
 */

import { useRouter } from "next/navigation";
import { 
  Users, 
  GitMerge, 
  Trophy, 
  Target,
  Award,
  Crown,
  Printer,
  CheckCircle2,
  Lock,
  Loader2
} from "lucide-react";

type PhaseStatus = "completed" | "active" | "locked";

interface TournamentPhase {
  id: string;
  name: string;
  slug: string;
  status: PhaseStatus;
  matchesCompleted: number;
  matchesTotal: number;
  description: string;
}

interface TournamentPhaseNavigatorProps {
  tournamentId: string;
  phases: TournamentPhase[];
}

export default function TournamentPhaseNavigator({
  tournamentId,
  phases,
}: TournamentPhaseNavigatorProps) {
  const router = useRouter();

  const getPhaseIcon = (id: string) => {
    switch (id) {
      case "groups": return Users;
      case "adjustment": return GitMerge;
      case "round_16":
      case "16avos": return Target;
      case "round_8":
      case "octavos": return Target;
      case "round_4":
      case "cuartos": return Trophy;
      case "round_2":
      case "semifinales": return Award;
      case "final": return Crown;
      default: return Target;
    }
  };

  const handlePhaseClick = (phase: TournamentPhase) => {
    if (phase.status === "locked") return;
    router.push(`/tournaments/${tournamentId}/${phase.slug}`);
  };

  const getStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      case "active":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "locked":
        return "bg-slate-800/50 border-slate-700/30 text-slate-500";
    }
  };

  const getStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "active":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "locked":
        return <Lock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: PhaseStatus) => {
    switch (status) {
      case "completed":
        return "Completada";
      case "active":
        return "En curso";
      case "locked":
        return "Bloqueada";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Gestión del Torneo
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Navega entre las fases del torneo. Las fases se habilitan progresivamente.
          </p>
        </div>
      </div>

      {/* Grid de fases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {phases.map((phase, index) => {
          const Icon = getPhaseIcon(phase.id);
          const isClickable = phase.status !== "locked";

          return (
            <button
              key={phase.id}
              onClick={() => handlePhaseClick(phase)}
              disabled={!isClickable}
              className={`
                relative p-4 rounded-xl border transition-all duration-200
                ${getStatusColor(phase.status)}
                ${
                  isClickable
                    ? "hover:scale-105 hover:shadow-lg cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                }
              `}
            >
              {/* Número de fase */}
              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                {index + 1}
              </div>

              {/* Icono y nombre */}
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-black/30">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-sm text-white leading-tight">
                    {phase.name}
                  </h4>
                  <p className="text-xs opacity-70 mt-0.5">
                    {phase.description}
                  </p>
                </div>
              </div>

              {/* Estado y progreso */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    {getStatusIcon(phase.status)}
                    {getStatusText(phase.status)}
                  </span>
                  {phase.matchesTotal > 0 && (
                    <span className="font-mono">
                      {phase.matchesCompleted}/{phase.matchesTotal}
                    </span>
                  )}
                </div>

                {/* Barra de progreso */}
                {phase.matchesTotal > 0 && (
                  <div className="h-1 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        phase.status === "completed"
                          ? "bg-emerald-500"
                          : phase.status === "active"
                          ? "bg-amber-500"
                          : "bg-slate-700"
                      }`}
                      style={{
                        width: `${
                          (phase.matchesCompleted / phase.matchesTotal) * 100
                        }%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Indicador de impresión disponible */}
              {phase.status !== "locked" && (
                <div className="absolute top-2 right-2">
                  <Printer className="w-3.5 h-3.5 opacity-40" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Completada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>En curso</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-700" />
          <span>Bloqueada</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Printer className="w-3 h-3" />
          <span>Planillas disponibles</span>
        </div>
      </div>
    </div>
  );
}
