import prisma from "@/lib/prisma";

const DISCIPLINE_LABELS: Record<string, string> = {
    THREE_BAND: "Tres Bandas",
    POOL_CHILENO: "Pool Chileno",
    POOL_8: "Bola 8",
    POOL_9: "Bola 9",
    POOL_10: "Bola 10",
    SNOOKER: "Snooker",
    HAYBALL: "Hayball",
};

function daysUntil(date: Date) {
    const diff = date.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

async function getUpcomingTournaments() {
    return prisma.tournament.findMany({
        where: {
            startDate: { gte: new Date() },
            status: { not: "DRAFT" },
        },
        orderBy: { startDate: "asc" },
        take: 3,
        select: {
            id: true,
            name: true,
            startDate: true,
            location: true,
            discipline: true,
            category: true,
        },
    });
}

export default async function TournamentsPreview() {
    const tournaments = await getUpcomingTournaments();

    if (tournaments.length === 0) return null;

    return (
        <section className="py-24 bg-[var(--color-primary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Próximos Torneos
                    </h2>
                    <div className="h-1 w-20 bg-[var(--color-secondary)] mx-auto" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tournaments.map(t => {
                        const days = daysUntil(t.startDate);
                        return (
                            <div key={t.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                                        {DISCIPLINE_LABELS[t.discipline] ?? t.discipline}
                                    </span>
                                    <div className="text-right shrink-0">
                                        <p className="text-3xl font-bold text-[var(--color-secondary)]">{days}</p>
                                        <p className="text-xs text-slate-300">{days === 1 ? "día" : "días"}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white leading-tight">{t.name}</h3>
                                    {t.location && (
                                        <p className="text-sm text-slate-300 mt-1">📍 {t.location}</p>
                                    )}
                                    <p className="text-sm text-slate-300 mt-1">
                                        📅 {t.startDate.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
