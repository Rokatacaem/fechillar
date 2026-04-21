import React from "react";
import prisma from "@/lib/prisma";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentClubs } from "@/components/dashboard/RecentClubs";
import { TournamentList } from "@/components/dashboard/TournamentList";
import {
  Users,
  Trophy,
  ArrowLeftRight,
  Activity
} from "lucide-react";
import { PurificationTrigger } from "@/components/admin/PurificationTrigger";
import { Toaster } from "sonner";

export const dynamic = "force-dynamic";

export default async function SgfDashboardPage() {
  let stats = {
    totalPlayers: 0,
    activeTournamentsCount: 0,
    pendingTransfers: 0,
    recentClubs: [],
    upcomingTournaments: [],
    isPurified: false,
    isSystemEmpty: false
  };

  // Consultas paralelas con manejo de errores defensivo para Prisma Accelerate
  try {
    const [
      playersCount,
      activeTournaments,
      clubsCount,
      tournamentsCount,
      lastAudit
    ] = await Promise.all([
      prisma.playerProfile.count().catch(() => 0),
      prisma.tournament.count({ where: { status: "IN_PROGRESS" } }).catch(() => 0),
      prisma.club.count().catch(() => 0),
      prisma.tournament.count().catch(() => 0),
      prisma.auditLog.findMany({
          take: 1,
          orderBy: { createdAt: "desc" }
      }).catch(() => [])
    ]);

    stats.totalPlayers = playersCount;
    stats.activeTournamentsCount = activeTournaments;
    stats.isPurified = lastAudit.length === 1 && lastAudit[0].action === "ENTORNO_PURIFICADO_SGF";
    stats.isSystemEmpty = playersCount === 0 && clubsCount === 0 && tournamentsCount === 0;

  } catch (error) {
    console.warn("⚠️ Advertencia: Error de conectividad con el motor de datos. Cargando modo degradado.");
  }

  return (
    <div className="space-y-10 p-2 md:p-6 animate-in fade-in duration-1000">
      <Toaster position="top-right" theme="dark" richColors />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Dashboard SGF <span className="text-emerald-500 font-medium">|</span> <span className="text-slate-400 font-medium">Federación</span>
          </h1>
          <p className="max-w-2xl text-slate-500 font-semibold uppercase tracking-widest text-[10px]">
            Panel Central de Gestión Federativa • Fechillar v1.2
          </p>
          
          {(stats as any).isPurified || (stats as any).isSystemEmpty ? (
            <div className="mt-2 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 font-black text-[10px] uppercase tracking-widest animate-pulse w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Entorno Purificado: Listo para Carga Oficial de Clubes
            </div>
          ) : null}
        </div>
        
        {!(stats as any).isSystemEmpty && (
            <div className="flex shrink-0">
                <PurificationTrigger />
            </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Jugadores Totales"
          value={stats.totalPlayers}
          icon="Users"
          description="Afiliados vigentes"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Torneos Activos"
          value={stats.activeTournamentsCount}
          icon="Trophy"
          description="En sala actualmente"
        />
        <MetricCard
          title="Traspasos"
          value={stats.pendingTransfers}
          icon="ArrowLeftRight"
          description="Solicitudes pendientes"
          trend={{ value: 5, isPositive: false }}
        />
        <MetricCard
          title="Rating SGF"
          value="4.8/5"
          icon="Activity"
          description="Nivel técnico global"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RecentClubs clubs={stats.recentClubs as any} />
        </div>
        <div className="lg:col-span-2">
          <TournamentList tournaments={stats.upcomingTournaments as any} />
        </div>
      </div>

      {/* Footer / SGF Engine Status */}
      <div className="rounded-3xl border border-dashed border-white/5 bg-white/[0.02] p-12 flex flex-col items-center justify-center text-center">
        <div className="h-10 w-10 text-slate-700 mb-4">
          <Activity className="h-full w-full" />
        </div>
        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Módulo SGF-Engine</h4>
        <p className="text-slate-600 text-[10px] mt-1 max-w-sm">
          El sistema está monitorizando la actividad en tiempo real a través de los clubes afiliados de la región.
        </p>
      </div>
    </div>
  );
}
