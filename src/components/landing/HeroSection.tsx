import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
    return (
        <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
            {/* Background Overlay - Replace with video or high-quality image later */}
            <div className="absolute inset-0 bg-[var(--color-primary)] z-0">
                {/* Optional: Add a subtle pattern or image with opacity here */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
                <div className="flex justify-center mb-8">
                    <Image
                        src="/fechillar_logo_final_v3_transparent.png"
                        alt="Logo Fechillar"
                        width={450}
                        height={450}
                        className="drop-shadow-2xl animate-fade-in-down"
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
                        Impulsando el desarrollo del Billar, Pool y Tres Bandas en todo Chile.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <Link
                        href="#disciplinas"
                        className="px-8 py-4 bg-[var(--color-secondary)] hover:bg-red-700 text-white rounded-md font-semibold transition-all hover:scale-105 shadow-[0_0_20px_rgba(213,43,30,0.3)]"
                    >
                        Explorar Disciplinas
                    </Link>
                    <Link
                        href="/login"
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-md font-semibold transition-all"
                    >
                        Zona Federados
                    </Link>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center p-2">
                    <div className="w-1 h-2 bg-white rounded-full"></div>
                </div>
            </div>
        </section>
    );
}
