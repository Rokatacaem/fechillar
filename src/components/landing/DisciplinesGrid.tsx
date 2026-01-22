
import Image from "next/image";

export default function DisciplinesGrid() {
    const disciplines = [
        {
            id: "tres-bandas",
            title: "Tres Bandas",
            description: "Precisión, estrategia y técnica depurada.",
            imageSrc: "/tres_bandas_cinematic.png",
            colSpan: "md:col-span-2",
            accent: "border-l-4 border-[var(--color-secondary)]"
        },
        {
            id: "pool",
            title: "Pool Chileno",
            description: "La tradición nacional en cada mesa.",
            imageSrc: "/pool_chileno_cinematic.png",
            colSpan: "md:col-span-1",
            accent: "border-l-4 border-white"
        },
        {
            id: "bola-8",
            title: "Bola 8, 9 y 10",
            description: "Velocidad y control internacional.",
            imageSrc: "/bola_8_9_cinematic.png",
            colSpan: "md:col-span-1",
            accent: "border-l-4 border-cyan-400"
        },
        {
            id: "snooker",
            title: "Snooker / Otras",
            description: "Disciplinas emergentes y formativas.",
            imageSrc: "/snooker_cinematic.png",
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
                            className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ${item.colSpan}`}
                        >
                            {/* Background Image with Ken Burns Effect */}
                            <div className="absolute inset-0 overflow-hidden">
                                <Image
                                    src={item.imageSrc}
                                    alt={item.title}
                                    fill
                                    className="object-cover transform transition-transform duration-[20s] ease-in-out group-hover:scale-125"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                {/* Dark Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500"></div>
                            </div>

                            {/* Content */}
                            <div className={`relative z-10 h-full flex flex-col justify-end p-8 ${item.accent}`}>
                                <h3 className="text-2xl font-bold text-white mb-2 transform group-hover:translate-x-2 transition-transform duration-300 drop-shadow-md">
                                    {item.title}
                                </h3>
                                <p className="text-slate-200 opacity-90 transform translate-y-0 transition-all duration-300 text-sm md:text-base font-light drop-shadow-sm">
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
