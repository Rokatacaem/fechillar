import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--color-primary)] text-white">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Fechillar
          </h1>
          <p className="text-xl md:text-2xl text-slate-200">
            Federación Chilena de Billar
          </p>
          <p className="text-lg text-slate-300 italic">
            Excelencia Deportiva en el Billar Chileno
          </p>

          <div className="flex gap-4 justify-center mt-8">
            <button className="px-6 py-3 bg-[var(--color-secondary)] hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-lg">
              Ver Disciplinas
            </button>
            <button className="px-6 py-3 bg-[var(--color-accent-green)] hover:bg-green-800 text-white rounded-lg font-semibold transition-colors shadow-lg">
              Portal Jugador
            </button>
          </div>
        </div>
      </main>

      {/* Footer Placeholder */}
      <footer className="p-6 bg-slate-900 text-slate-400 text-center text-sm">
        <p>© {new Date().getFullYear()} Fechillar. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
