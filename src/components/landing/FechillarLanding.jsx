import Link from "next/link";
import { Trophy, ShieldCheck, Users, Sparkles } from "lucide-react";

export default function FechillarLanding() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(248,113,113,0.22),_transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_25%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.24em] text-slate-200">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Portal oficial Fechillar
              </span>
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
                  Conecta al billar chileno con un sistema centralizado de torneos.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Fechillar reúne gestión de clubes, rankings, inscripciones y resultados en una interfaz moderna, segura y preparada para federados y público general.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-700"
                >
                  Ingresar federados
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white transition hover:border-white hover:bg-white/15"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>

            <div className="grid gap-6">
              {[
                {
                  icon: Trophy,
                  title: "Torneos y fases",
                  description:
                    "Administra torneos, fases, cuadros y resultados con botones claros para cada etapa.",
                },
                {
                  icon: Users,
                  title: "Clubes y federados",
                  description:
                    "Controla clubes, delegados y jugadores con acceso seguro para federados y staff.",
                },
                {
                  icon: ShieldCheck,
                  title: "Autenticación segura",
                  description:
                    "Login con NextAuth y roles de acceso que protegen datos de torneo y administración.",
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-slate-950/40 ring-1 ring-white/10 backdrop-blur-xl">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-rose-300 ring-1 ring-white/10">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold text-white">{feature.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950/90 py-16">
        <div className="max-w-6xl mx-auto px-4 grid gap-10 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-xl font-semibold text-white">Gestión unificada</h3>
            <p className="mt-4 text-slate-300">Un solo panel para torneos, rankings, clubes y resultados con controles claros para el staff federado.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-xl font-semibold text-white">Transparencia</h3>
            <p className="mt-4 text-slate-300">Procesos de inscripción y resultados visibles, con tracking de avances y estadísticas en tiempo real.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-xl font-semibold text-white">Acceso federados</h3>
            <p className="mt-4 text-slate-300">Roles definidos e inicio de sesión protegido para delegados, administradores y árbitros.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
