import type { Metadata } from "next";
// globals.css NO se importa aquí — lo hereda del RootLayout (src/app/layout.tsx)

export const metadata: Metadata = {
  title: "Fechillar - Federación Chilena de Billar",
  description: "Plataforma oficial de la Federación Chilena de Billar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
      <div className="antialiased bg-[#020817] min-h-screen flex flex-col">
        <div className="flex-grow">
          {children}
        </div>
        
        {/* Footer Institucional de AutoLink */}
        <footer className="border-t border-white/5 bg-slate-950 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
            <p className="text-slate-500 text-sm font-medium">
              Tecnología por <span className="text-white font-black tracking-tight">Auto<span className="text-emerald-500">Link</span></span> | Proyectos WOR
            </p>
            <p className="text-slate-700 text-xs">
              Módulo de Torneos SGF & White-label
            </p>
          </div>
        </footer>
      </div>
    );
}
