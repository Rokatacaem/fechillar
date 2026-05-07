import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFederatedCensus, getClubs } from "./census-actions";
import { PadronTable } from "./PadronTable";

export const metadata = {
  title: "Padrón Nacional | FECHILLAR",
  description: "Padrón Nacional de Jugadores Federados"
};

export const dynamic = "force-dynamic";

export default async function PadronNacionalPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [rawPlayers, clubs] = await Promise.all([getFederatedCensus(), getClubs()]);
  const isSuperAdmin = (session.user as any)?.role === "SUPERADMIN";

  const totalAfiliados = rawPlayers.length;
  const totalConRanking = rawPlayers.filter(p => p.rankings && p.rankings.length > 0).length;
  const totalConCuenta = rawPlayers.filter(p => p.userId).length;
  const totalSinClub = rawPlayers.filter(p => !p.tenantId && !p.firstName?.startsWith("ELIMINADO")).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Padrón Nacional</h1>
            <p className="text-slate-400">Registro de jugadores federados</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/reports/ranking?discipline=THREE_BAND"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ranking Nacional
            </a>
            <a
              href="/api/reports/ranking?discipline=THREE_BAND_ANNUAL"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ranking Anual
            </a>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{totalAfiliados}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Afiliados</p>
          </div>
          <div className="bg-slate-800/50 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-400">{totalConRanking}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Con Ranking</p>
          </div>
          <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-400">{totalConCuenta}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Con Cuenta</p>
          </div>
          <div className="bg-slate-800/50 border border-amber-500/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-400">{totalSinClub}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Sin Club</p>
          </div>
        </div>
      </div>

      <div>
        <PadronTable
          players={rawPlayers as any}
          clubs={clubs}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </div>
  );
}
