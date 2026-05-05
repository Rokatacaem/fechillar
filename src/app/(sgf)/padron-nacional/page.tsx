import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFederatedCensus } from "./census-actions";
import { RankingEditButton } from "@/components/admin/RankingEditButton";
import { SortableTh } from "./SortableTh";
import { Suspense } from "react";

export const metadata = {
  title: "Padrón Nacional | FECHILLAR",
  description: "Padrón Nacional de Jugadores Federados"
};

export const dynamic = "force-dynamic";

type SortKey = "nombre" | "club" | "ranking" | "promedio" | "puntos";
type SortDir = "asc" | "desc";

/** Obtiene el ranking activo de un jugador (Anual > Nacional) */
function getActiveRanking(player: Awaited<ReturnType<typeof getFederatedCensus>>[number]) {
  const annual = player.rankings?.find(r => r.discipline === 'THREE_BAND_ANNUAL');
  const national = player.rankings?.find(r => r.discipline === 'THREE_BAND');
  return { activeRanking: annual || national, isAnnual: !!annual };
}

/** Ordena los jugadores según sort key y dirección */
function sortPlayers(
  players: Awaited<ReturnType<typeof getFederatedCensus>>,
  sort: SortKey,
  dir: SortDir
) {
  const asc = dir === "asc";

  return [...players].sort((a, b) => {
    const arA = getActiveRanking(a).activeRanking;
    const arB = getActiveRanking(b).activeRanking;

    let cmp = 0;

    switch (sort) {
      case "nombre": {
        const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
        const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
        cmp = nameA.localeCompare(nameB, "es");
        break;
      }
      case "club": {
        const clubA = (a.club?.name ?? "").toLowerCase();
        const clubB = (b.club?.name ?? "").toLowerCase();
        cmp = clubA.localeCompare(clubB, "es");
        break;
      }
      case "ranking": {
        const posA = (!arA?.rankPosition || arA.rankPosition >= 999) ? 9999 : arA.rankPosition;
        const posB = (!arB?.rankPosition || arB.rankPosition >= 999) ? 9999 : arB.rankPosition;
        cmp = posA - posB;
        break;
      }
      case "promedio": {
        const avgA = arA?.average ?? -1;
        const avgB = arB?.average ?? -1;
        cmp = avgA - avgB;
        break;
      }
      case "puntos": {
        const ptA = arA?.points ?? -1;
        const ptB = arB?.points ?? -1;
        cmp = ptA - ptB;
        break;
      }
    }

    return asc ? cmp : -cmp;
  });
}

export default async function PadronNacionalPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const { sort: rawSort, dir: rawDir } = await searchParams;
  const sort: SortKey = (["nombre", "club", "ranking", "promedio", "puntos"].includes(rawSort ?? "")
    ? rawSort
    : "ranking") as SortKey;
  const dir: SortDir = rawDir === "desc" ? "desc" : "asc";

  const rawPlayers = await getFederatedCensus();
  const players = sortPlayers(rawPlayers, sort, dir);
  const isSuperAdmin = (session?.user as any)?.role === 'SUPERADMIN';

  // Estadísticas derivadas
  const totalAfiliados = players.length;
  const totalHabilitados = players.filter(p => p.rankings && p.rankings.length > 0).length;
  const totalConCuenta = players.filter(p => p.userId).length;
  const totalSinCuenta = totalAfiliados - totalConCuenta;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Padrón Nacional
            </h1>
            <p className="text-slate-400">
              Registro de jugadores federados
            </p>
          </div>

          {/* Botones de Informes */}
          <div className="flex items-center gap-3">
            <a
              href="/api/reports/ranking?discipline=THREE_BAND"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
                hover:bg-emerald-500/20 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ranking Nacional
            </a>
            <a
              href="/api/reports/ranking?discipline=THREE_BAND_ANNUAL"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                bg-blue-500/10 text-blue-400 border border-blue-500/20
                hover:bg-blue-500/20 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ranking Anual
            </a>
          </div>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{totalAfiliados}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Afiliados</p>
          </div>
          <div className="bg-slate-800/50 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-400">{totalHabilitados}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Con Ranking</p>
          </div>
          <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-400">{totalConCuenta}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Con Cuenta</p>
          </div>
          <div className="bg-slate-800/50 border border-amber-500/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-400">{totalSinCuenta}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Sin Cuenta</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950/50 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-10">
                    #
                  </th>
                  <Suspense>
                    <SortableTh label="Nombre" sortKey="nombre" currentSort={sort} currentDir={dir} />
                    <SortableTh label="Club" sortKey="club" currentSort={sort} currentDir={dir} />
                    <SortableTh label="Ranking" sortKey="ranking" currentSort={sort} currentDir={dir} />
                    <SortableTh label="Promedio" sortKey="promedio" currentSort={sort} currentDir={dir} />
                    <SortableTh label="Puntos" sortKey="puntos" currentSort={sort} currentDir={dir} />
                  </Suspense>
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
                {players.map((player, idx) => {
                  const { activeRanking, isAnnual } = getActiveRanking(player);
                  const hasRanking = !!activeRanking;
                  const hasAccount = !!player.userId;

                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-slate-500 font-mono">{idx + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {player.firstName} {player.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {player.club?.name ? (
                          <div className="text-sm text-slate-300">{player.club.name}</div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Sin club</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">
                          {(!activeRanking?.rankPosition || activeRanking.rankPosition >= 999) ? '-' : activeRanking.rankPosition}
                          {isAnnual && (
                            <span className="ml-2 text-xs text-blue-400">(Anual)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-emerald-400">
                          {activeRanking?.average?.toFixed(3) ?? '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">
                          {activeRanking?.points ?? '-'}
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
                          {!hasAccount && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              Sin cuenta
                            </span>
                          )}
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* ✅ FIX APLICADO: Se entrega la prop isSuper={isSuperAdmin} */}
                          <RankingEditButton player={player as any} isSuper={isSuperAdmin} />
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
    </div>
  );
}