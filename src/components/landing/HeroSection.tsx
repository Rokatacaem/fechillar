import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

async function getStats() {
    noStore();
    const [players, clubs] = await Promise.all([
        prisma.playerProfile.count({
            where: { NOT: { firstName: { startsWith: "ELIMINADO" } } },
        }),
        prisma.club.count(),
    ]);
    return { players, clubs };
}

export default async function HeroSection() {
    const { players, clubs } = await getStats();

    return (
        <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-transparent z-0" />

            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
                <div className="flex justify-center mb-6">
                    <Image
                        src="/fechillar_logo_final_v5.jpg"
                        alt="Logo Fechillar"
                        width={160}
                        height={160}
                        className="drop-shadow-2xl animate-fade-in-down rounded-xl opacity-90"
                    />
                </div>

                <div className="space-y-4">
                    <h2 className="text-secondary font-medium tracking-widest uppercase text-sm md:text-base text-slate-300">
                        Federación Chilena de Billar
                    </h2>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-tight">
                        Excelencia <span className="text-[var(--color-secondary)]">Deportiva</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto font-light">
                        {players} jugadores federados en {clubs} clubes a lo largo de Chile.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link
                        href="#rankings"
                        className="px-8 py-4 bg-[var(--color-secondary)] hover:bg-red-700 text-white rounded-md font-semibold transition-all hover:scale-105 shadow-[0_0_20px_rgba(213,43,30,0.3)]"
                    >
                        Ver Rankings Oficiales
                    </Link>
                    <Link
                        href="/login"
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-md font-semibold transition-all"
                    >
                        Zona Federados
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 max-w-lg mx-auto">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-3xl font-bold text-white">{players}</p>
                        <p className="text-xs text-slate-300 uppercase tracking-wider mt-1">Jugadores</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-3xl font-bold text-white">{clubs}</p>
                        <p className="text-xs text-slate-300 uppercase tracking-wider mt-1">Clubes</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="text-3xl font-bold text-[var(--color-secondary)]">3</p>
                        <p className="text-xs text-slate-300 uppercase tracking-wider mt-1">Disciplinas</p>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center p-2">
                    <div className="w-1 h-2 bg-white rounded-full"></div>
                </div>
            </div>
        </section>
    );
}
