import HeroSection from "@/components/landing/HeroSection";
import DisciplinesGrid from "@/components/landing/DisciplinesGrid";
import RankingsPreview from "@/components/landing/RankingsPreview";
import TransparencyPanel from "@/components/landing/TransparencyPanel";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />

      <DisciplinesGrid />

      <RankingsPreview />

      <TransparencyPanel />

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Fechillar</h4>
            <p className="text-sm">Federación Chilena de Billar<br />Fundada con pasión por el deporte.</p>
          </div>
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Reglamentos</a></li>
              <li><a href="#" className="hover:text-white">Rankings</a></li>
              <li><a href="#" className="hover:text-white">Clubes Asociados</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Contacto</h4>
            <p className="text-sm">contacto@fechillar.cl<br />Santiago, Chile</p>
          </div>
        </div>
        <div className="text-center text-sm border-t border-slate-800 pt-8">
          <p>© {new Date().getFullYear()} Fechillar. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
