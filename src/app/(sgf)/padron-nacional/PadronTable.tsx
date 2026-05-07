"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Building, AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { AssignClubButton } from "@/components/players/AssignClubButton";
import { RankingEditButton } from "@/components/admin/RankingEditButton";
import { DeletePlayerButton } from "@/components/players/DeletePlayerButton";

type SortKey = "nombre" | "club" | "ranking" | "promedio" | "puntos";
type SortDir = "asc" | "desc";

interface Ranking {
  discipline: string;
  rankPosition: number | null;
  average: number | null;
  points: number | null;
}

interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  rut: string | null;
  tenantId: string | null;
  gender: string | null;
  photoUrl: string | null;
  userId: string | null;
  slug: string;
  club: { id: string; name: string } | null;
  rankings: Ranking[];
}

interface PadronTableProps {
  players: PlayerData[];
  clubs: { id: string; name: string }[];
  isSuperAdmin: boolean;
}

function getActiveRanking(player: PlayerData) {
  const annual = player.rankings?.find(r => r.discipline === "THREE_BAND_ANNUAL");
  const national = player.rankings?.find(r => r.discipline === "THREE_BAND");
  return { activeRanking: annual || national, isAnnual: !!annual };
}

function isEliminado(p: PlayerData) {
  return p.firstName?.startsWith("ELIMINADO") || p.slug?.startsWith("del-");
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 text-emerald-400" />
    : <ChevronDown className="w-3 h-3 text-emerald-400" />;
}

export function PadronTable({ players, clubs, isSuperAdmin }: PadronTableProps) {
  const [search, setSearch] = useState("");
  const [filterSinClub, setFilterSinClub] = useState(false);
  const [showEliminados, setShowEliminados] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("ranking");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const router = useRouter();

  const sinClubCount = useMemo(
    () => players.filter(p => !p.tenantId && !isEliminado(p)).length,
    [players]
  );
  const eliminadosCount = useMemo(() => players.filter(isEliminado).length, [players]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let result = players;

    // Siempre excluir ELIMINADOS a menos que se pida verlos
    if (!showEliminados) {
      result = result.filter(p => !isEliminado(p));
    } else {
      result = result.filter(isEliminado);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        p =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.club?.name?.toLowerCase().includes(q) ||
          (p.rut ?? "").toLowerCase().includes(q)
      );
    }

    if (filterSinClub) {
      result = result.filter(p => !p.tenantId);
    }

    return [...result].sort((a, b) => {
      const arA = getActiveRanking(a).activeRanking;
      const arB = getActiveRanking(b).activeRanking;
      let cmp = 0;
      switch (sortKey) {
        case "nombre":
          cmp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "es");
          break;
        case "club":
          cmp = (a.club?.name ?? "").localeCompare(b.club?.name ?? "", "es");
          break;
        case "ranking": {
          const posA = !arA?.rankPosition || arA.rankPosition >= 999 ? 9999 : arA.rankPosition;
          const posB = !arB?.rankPosition || arB.rankPosition >= 999 ? 9999 : arB.rankPosition;
          cmp = posA - posB;
          break;
        }
        case "promedio":
          cmp = (arA?.average ?? -1) - (arB?.average ?? -1);
          break;
        case "puntos":
          cmp = (arA?.points ?? -1) - (arB?.points ?? -1);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [players, search, filterSinClub, showEliminados, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, RUT o club..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <button
          onClick={() => { setFilterSinClub(!filterSinClub); setShowEliminados(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
            filterSinClub
              ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
              : "bg-slate-800/50 text-slate-400 border-white/10 hover:border-amber-500/30 hover:text-amber-400"
          }`}
        >
          <Building className="w-4 h-4" />
          Sin club
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
            filterSinClub ? "bg-amber-500/30" : "bg-slate-700"
          }`}>
            {sinClubCount}
          </span>
        </button>

        {isSuperAdmin && eliminadosCount > 0 && (
          <button
            onClick={() => { setShowEliminados(!showEliminados); setFilterSinClub(false); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              showEliminados
                ? "bg-red-500/20 text-red-400 border-red-500/40"
                : "bg-red-500/10 text-red-400/70 border-red-500/20 hover:border-red-500/40 hover:text-red-400"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Eliminados pendientes
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/30 font-black">
              {eliminadosCount}
            </span>
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-950/50 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-10">
                  #
                </th>
                {(["nombre", "club", "ranking", "promedio", "puntos"] as SortKey[]).map(key => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={sortKey === key ? "text-emerald-400" : ""}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                      <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin resultados</p>
                  </td>
                </tr>
              )}
              {filtered.map((player, idx) => {
                const { activeRanking, isAnnual } = getActiveRanking(player);
                const hasRanking = !!activeRanking;
                const hasAccount = !!player.userId;
                const isEl = isEliminado(player);
                const sinClub = !player.tenantId && !isEl;

                return (
                  <tr
                    key={player.id}
                    className={`transition-colors ${
                      isEl
                        ? "bg-red-950/30 hover:bg-red-950/40"
                        : sinClub
                        ? "hover:bg-amber-500/5"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-slate-500 font-mono">{idx + 1}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isEl ? "text-red-400/70 line-through" : "text-white"}`}>
                        {player.firstName} {player.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {player.club?.name ? (
                        <div className="text-sm text-slate-300">{player.club.name}</div>
                      ) : (
                        <span className="text-xs text-amber-500/70 italic">Sin club</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {!activeRanking?.rankPosition || activeRanking.rankPosition >= 999
                          ? "-"
                          : activeRanking.rankPosition}
                        {isAnnual && (
                          <span className="ml-2 text-xs text-blue-400">(Anual)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-emerald-400">
                        {activeRanking?.average?.toFixed(3) ?? "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {activeRanking?.points ?? "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {hasRanking ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Habilitado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Sin ranking
                          </span>
                        )}
                        {!hasAccount && !isEl && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            Sin cuenta
                          </span>
                        )}
                        {isEl && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Pendiente borrar
                          </span>
                        )}
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {!isEl && (
                            <>
                              <AssignClubButton player={player} clubs={clubs} />
                              <RankingEditButton player={player as any} isSuper={isSuperAdmin} />
                            </>
                          )}
                          <DeletePlayerButton
                            playerId={player.id}
                            playerName={`${player.firstName} ${player.lastName}`}
                            onDeleted={() => router.refresh()}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
