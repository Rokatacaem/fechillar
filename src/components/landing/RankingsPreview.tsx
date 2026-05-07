"use client";

import { useState, useEffect, useCallback } from "react";

const DISCIPLINES = [
    { value: "THREE_BAND", label: "Tres Bandas" },
    { value: "POOL_CHILENO", label: "Pool Chileno" },
    { value: "POOL_8", label: "Bola 8" },
    { value: "POOL_9", label: "Bola 9" },
];

const CATEGORIES = [
    { value: "MASTER", label: "Máster" },
    { value: "HONOR", label: "Honor" },
    { value: "FIRST", label: "Primera" },
    { value: "SECOND", label: "Segunda" },
    { value: "FEMALE", label: "Femenino" },
    { value: "SENIOR", label: "Senior" },
];

type Player = { rank: number; name: string; club: string; points: number; average: number | null };

function Medal({ rank }: { rank: number }) {
    if (rank === 1) return <span className="text-yellow-500 font-bold text-lg">🥇</span>;
    if (rank === 2) return <span className="text-slate-400 font-bold text-lg">🥈</span>;
    if (rank === 3) return <span className="text-orange-600 font-bold text-lg">🥉</span>;
    return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-sm">{rank}</span>;
}

export default function RankingsPreview() {
    const [discipline, setDiscipline] = useState("THREE_BAND");
    const [category, setCategory] = useState("MASTER");
    const [players, setPlayers] = useState<Player[]>([]);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRankings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/public/rankings?discipline=${discipline}&category=${category}&limit=10`);
            const json = await res.json();
            setPlayers(json.data ?? []);
            setUpdatedAt(json.updatedAt ?? null);
        } catch {
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    }, [discipline, category]);

    useEffect(() => {
        fetchRankings();
        const interval = setInterval(fetchRankings, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchRankings]);

    const formatDate = (iso: string | null) => {
        if (!iso) return "";
        return new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
    };

    return (
        <section id="rankings" className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-primary)]">
                                Rankings Nacionales
                            </h2>
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Desde SGF
                            </span>
                        </div>
                        {updatedAt && (
                            <p className="text-sm text-slate-400">Actualizado: {formatDate(updatedAt)}</p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <select
                            value={discipline}
                            onChange={e => setDiscipline(e.target.value)}
                            title="Disciplina"
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
                        >
                            {DISCIPLINES.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            title="Categoría"
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={fetchRankings}
                            disabled={loading}
                            className="text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            title="Actualizar"
                        >
                            {loading ? "⟳" : "↻"} Actualizar
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="py-16 text-center text-slate-400">
                            <div className="animate-spin text-3xl mb-2">⟳</div>
                            <p className="text-sm">Cargando ranking...</p>
                        </div>
                    ) : players.length === 0 ? (
                        <div className="py-16 text-center text-slate-400">
                            <p className="text-sm">No hay datos de ranking para esta selección.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider w-16">#</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Jugador</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider">Club</th>
                                        <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider text-right">Puntos</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {players.map(player => (
                                        <tr key={player.rank} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Medal rank={player.rank} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--color-primary)]">
                                                {player.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                                                {player.club}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-700">
                                                {player.points}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <a
                        href="/api/reports/ranking?discipline=THREE_BAND"
                        target="_blank"
                        className="inline-flex items-center gap-2 text-[var(--color-secondary)] font-semibold hover:text-red-800 transition-colors"
                    >
                        Ver Ranking Nacional completo (PDF) →
                    </a>
                </div>
            </div>
        </section>
    );
}
