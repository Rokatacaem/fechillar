import Link from "next/link";
import Image from "next/image";

export default function PlayerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar - Mobile Responsive hidden for MVP simplicity, assume desktop/tablet for structure */}
            <aside className="hidden md:flex flex-col w-64 bg-[var(--color-primary)] text-white">
                <div className="p-6 border-b border-blue-900 flex flex-col items-center text-center">
                    <Image src="/fechillar_logo_final_v5.jpg" alt="Fechillar" width={60} height={60} className="mb-3 rounded-md" />
                    <h2 className="text-xl font-bold tracking-tight">Fechillar</h2>
                    <p className="text-xs text-slate-300 uppercase tracking-widest mt-1">Portal Jugador</p>
                </div>

                <nav className="flex-1 py-6 space-y-2 px-3">
                    <Link href="/player" className="block px-4 py-3 rounded-lg bg-blue-900/50 text-white font-medium hover:bg-blue-800 transition-colors">
                        🏠 Dashboard
                    </Link>
                    <Link href="/player/tournaments" className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-blue-800 hover:text-white transition-colors">
                        🏆 Torneos
                    </Link>
                    <Link href="/player/rankings" className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-blue-800 hover:text-white transition-colors">
                        📊 Mis Rankings
                    </Link>
                    <Link href="/player/card" className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-blue-800 hover:text-white transition-colors">
                        💳 Carnet Digital
                    </Link>
                </nav>

                <div className="p-4 border-t border-blue-900">
                    <Link href="/api/auth/signout" className="block px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                        Cerrar Sesión
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Topbar for Mobile (or general info) */}
                <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-8 md:hidden">
                    <span className="font-bold text-[var(--color-primary)]">Fechillar Portal</span>
                    {/* Simple Hamburger placeholder */}
                    <button className="text-slate-500">☰</button>
                </header>

                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
