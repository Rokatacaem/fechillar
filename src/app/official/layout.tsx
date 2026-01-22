import Link from "next/link";
import Image from "next/image";

export default function OfficialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Distinct 'Official' style (darker or different hue) */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white">
                <div className="p-6 border-b border-slate-700 flex flex-col items-center text-center">
                    <Image src="/fechillar_logo_final_v4_solid.png" alt="Fechillar" width={60} height={60} className="mb-3" />
                    <h2 className="text-xl font-bold tracking-tight text-[var(--color-secondary)]">Fechillar</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Gestión Dirigencial</p>
                </div>

                <nav className="flex-1 py-6 space-y-2 px-3">
                    <Link href="/official" className="block px-4 py-3 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">
                        📊 Panel General
                    </Link>
                    <Link href="/official/minutes" className="block px-4 py-3 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        📜 Actas de Reunión
                    </Link>
                    <Link href="/official/clubs" className="block px-4 py-3 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        🏢 Gestión de Clubes
                    </Link>
                    <Link href="/official/finance" className="block px-4 py-3 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        💰 Control Financiero
                    </Link>
                    <Link href="/official/players" className="block px-4 py-3 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        👥 Base de Jugadores
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs">AD</div>
                        <div className="text-sm">
                            <div className="font-medium">Admin</div>
                            <div className="text-xs text-slate-500">Dirigente</div>
                        </div>
                    </div>
                    <Link href="/api/auth/signout" className="block px-4 py-2 text-sm text-center bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded transition-colors">
                        Cerrar Sesión
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
