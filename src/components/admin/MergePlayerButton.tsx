"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GitMerge, Search, X, AlertTriangle, Loader2 } from "lucide-react";
import { searchPlayers, mergePlayer } from "@/app/(sgf)/players/actions";

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    club: { name: string } | null;
}

interface SearchResult {
    id: string;
    name: string;
    club: string;
    rut: string | null;
}

export function MergePlayerButton({ player, isSuper }: { player: Player; isSuper: boolean }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selected, setSelected] = useState<SearchResult | null>(null);
    const [searching, setSearching] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    if (!isSuper) return null;

    const handleOpen = () => {
        setOpen(true);
        setQuery("");
        setResults([]);
        setSelected(null);
        setError(null);
    };

    const handleSearch = useCallback(async (q: string) => {
        setQuery(q);
        setSelected(null);
        if (q.length < 2) { setResults([]); return; }
        setSearching(true);
        try {
            const r = await searchPlayers(q);
            setResults((r as SearchResult[]).filter(p => p.id !== player.id));
        } finally {
            setSearching(false);
        }
    }, [player.id]);

    const handleMerge = () => {
        if (!selected) return;
        setError(null);
        startTransition(async () => {
            try {
                await mergePlayer(player.id, selected.id);
                setOpen(false);
                router.refresh();
            } catch (e: any) {
                setError(e.message ?? "Error al fusionar");
            }
        });
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="text-amber-500 hover:text-amber-400 text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-xl transition-colors border border-amber-500/20"
            >
                Fusionar
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">

                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                    <GitMerge className="w-5 h-5 text-amber-400" />
                                    Fusionar jugador
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Conservar:{" "}
                                    <span className="text-white font-semibold">
                                        {player.firstName} {player.lastName}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-slate-500 hover:text-white transition-colors mt-0.5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                                Buscar duplicado a eliminar
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                {searching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
                                )}
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder="Nombre, RUT..."
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                                />
                            </div>

                            {results.length > 0 && !selected && (
                                <div className="mt-2 border border-white/10 rounded-xl overflow-hidden bg-slate-800 max-h-48 overflow-y-auto">
                                    {results.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => { setSelected(r); setResults([]); }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                        >
                                            <div className="text-sm text-white font-medium">{r.name}</div>
                                            <div className="text-xs text-slate-400">{r.club}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.length === 0 && query.length >= 2 && !searching && !selected && (
                                <p className="mt-2 text-xs text-slate-500 text-center py-2">Sin resultados</p>
                            )}
                        </div>

                        {selected && (
                            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Duplicado a eliminar</p>
                                        <p className="text-white font-semibold">{selected.name}</p>
                                        <p className="text-slate-400 text-sm">{selected.club}</p>
                                    </div>
                                    <button
                                        onClick={() => { setSelected(null); setQuery(""); }}
                                        className="text-slate-500 hover:text-white transition-colors shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-amber-400/80">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <span>
                                        Los rankings e inscripciones de <strong>{selected.name}</strong> se transferirán a{" "}
                                        <strong>{player.firstName} {player.lastName}</strong> y el registro duplicado
                                        será eliminado permanentemente.
                                    </span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-red-400 text-sm bg-red-950/20 border border-red-500/20 rounded-xl px-4 py-3">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setOpen(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleMerge}
                                disabled={!selected || isPending}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isPending ? "Fusionando..." : "Confirmar fusión"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
