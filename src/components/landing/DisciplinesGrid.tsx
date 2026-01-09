
export default function DisciplinesGrid() {
    const disciplines = [
        {
            id: "tres-bandas",
            title: "Tres Bandas",
            description: "Precisión, estrategia y técnica depurada.",
            bgClass: "bg-slate-800", // Replace with specific images later
            colSpan: "md:col-span-2",
            accent: "border-l-4 border-[var(--color-secondary)]"
        },
        {
            id: "pool",
            title: "Pool Chileno",
            description: "La tradición nacional en cada mesa.",
            bgClass: "bg-[var(--color-accent-green)]",
            colSpan: "md:col-span-1",
            accent: "border-l-4 border-white"
        },
        {
            id: "bola-8",
            title: "Bola 8 y 9",
            description: "Velocidad y control internacional.",
            bgClass: "bg-blue-900",
            colSpan: "md:col-span-1",
            accent: "border-l-4 border-cyan-400"
        },
        {
            id: "snooker",
            title: "Snooker / Otras",
            description: "Disciplinas emergentes y formativas.",
            bgClass: "bg-slate-700",
            colSpan: "md:col-span-2",
            accent: "border-l-4 border-yellow-500"
        }
    ];

    return (
        <section id="disciplinas" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-primary)] mb-4">
                        Nuestras Disciplinas
                    </h2>
                    <div className="h-1 w-20 bg-[var(--color-secondary)] mx-auto"></div>
                    <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                        Descubre las modalidades competitivas reguladas por la federación.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                    {disciplines.map((item) => (
                        <div
                            key={item.id}
                            className={`group relative overflow-hidden rounded-2xl shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl ${item.bgClass} ${item.colSpan}`}
                        >
                            {/* Overlay Hover Effect */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500"></div>

                            <div className={`absolute bottom-0 left-0 p-8 w-full ${item.accent}`}>
                                <h3 className="text-2xl font-bold text-white mb-2 transform group-hover:translate-x-2 transition-transform">
                                    {item.title}
                                </h3>
                                <p className="text-slate-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
