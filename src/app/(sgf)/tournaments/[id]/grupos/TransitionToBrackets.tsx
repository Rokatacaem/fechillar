"use client";

import React, { useState, useEffect, useTransition } from "react";
// ✅ RUTA FINAL CORREGIDA: Traemos las acciones desde sus orígenes globales
import { getGroupStandings } from "@/lib/tournament-results";
import { generateKnockoutPhase } from "@/app/(sgf)/tournaments/matchmaking/actions";

import { Trophy, Users, Info, ChevronRight, Loader2, Sparkles, Settings, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
    tournamentId: string;
    onClose: () => void;
}

export function TransitionToBrackets({ tournamentId, onClose }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [standings, setStandings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [qCount, setQCount] = useState(16);
    const [generating, setGenerating] = useState(false);
    const [isAuditMode, setIsAuditMode] = useState(false);

    // Sort logic
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStandings = React.useMemo(() => {
        let sortableItems = [...standings];
        if (sortConfig !== null && !isAuditMode) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [standings, sortConfig, isAuditMode]);

    const movePlayer = (index: number, direction: 'up' | 'down') => {
        if (!isAuditMode) return;
        const newStandings = [...standings];
        if (direction === 'up' && index > 0) {
            const temp = newStandings[index - 1];
            newStandings[index - 1] = newStandings[index];
            newStandings[index] = temp;
        } else if (direction === 'down' && index < newStandings.length - 1) {
            const temp = newStandings[index + 1];
            newStandings[index + 1] = newStandings[index];
            newStandings[index] = temp;
        }
        setStandings(newStandings);
    };


    useEffect(() => {
        async function load() {
            try {
                const res = await getGroupStandings(tournamentId);
                if (res.success) {
                    setStandings(res.standings || []);
                } else {
                    toast.error(res.error || "Error al cargar posiciones");
                }
            } catch (e) {
                toast.error("Error de conexión con el motor");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tournamentId]);

    const handleGenerateBrackets = async () => {
        let msg = `¿Estás seguro de generar el cuadro con los ${qCount} mejores clasificados?`;
        if (isAuditMode) msg = `⚠️ MODO AUDITORÍA ACTIVO.\n\n¿Deseas continuar?`;

        const ok = confirm(msg);
        if (!ok) return;

        setGenerating(true);
        const customPlayerIds = isAuditMode ? sortedStandings.map(s => s.playerId) : undefined;
        try {
            const res = await generateKnockoutPhase(tournamentId, qCount, customPlayerIds);
            if (res.success) {
                toast.success("Cuadro generado con éxito");
                startTransition(() => {
                    router.push(`/tournaments/${tournamentId}/cuadros`);
                    router.refresh();
                });
            } else {
                toast.error(res.error);
                setGenerating(false);
            }
        } catch (e) {
            toast.error("Error crítico en la generación");
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Calculando Clasificación...</p>
                </div>
            </div>
        );
    }

    const P = Math.pow(2, Math.floor(Math.log2(qCount)));
    const isAdjustmentNeeded = qCount !== P && qCount > 0;
    const adjCount = qCount - P;
    const byeCount = qCount - (2 * adjCount);

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-12 animate-in fade-in zoom-in duration-300">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header UI - Igual a la anterior */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-violet-500/20 rounded-xl">
                                <Sparkles className="w-5 h-5 text-violet-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Motor de Cuadros</span>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">TRANSICIÓN A <span className="text-violet-400">ELIMINATORIAS</span></h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} disabled={generating} className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm">Cancelar</button>
                        <button onClick={handleGenerateBrackets} disabled={generating} className="px-8 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center gap-2">
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                            Generar Cuadro
                        </button>
                    </div>
                </div>

                {/* Tabla y Configuración (Manteniendo tu lógica visual) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2 bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Clasificados</label>
                        <div className="flex flex-wrap gap-2">
                            {[8, 12, 16, 24, 32, 48, 64].map(n => (
                                <button key={n} onClick={() => setQCount(n)} className={`px-6 py-3 rounded-2xl font-black text-sm ${qCount === n ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-500"}`}>{n}</button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8">
                        <p className="text-[10px] font-black uppercase text-slate-500">Formato</p>
                        <p className="text-xs font-bold text-white">Single Elimination</p>
                    </div>
                </div>

                {/* Tabla de Clasificados */}
                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-slate-950/50 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                {isAuditMode && <th className="px-6 py-4">Mover</th>}
                                <th className="px-6 py-4 text-center">Nº</th>
                                <th className="px-6 py-4">Atleta</th>
                                <th className="px-6 py-4 text-center">PM</th>
                                <th className="px-6 py-4 text-center text-emerald-500">PP</th>
                                <th className="px-6 py-4 text-right">Destino</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedStandings.slice(0, qCount).map((s, i) => (
                                <tr key={s.playerId} className="hover:bg-white/5 text-sm">
                                    {isAuditMode && (
                                        <td className="px-6 py-4">
                                            <button onClick={() => movePlayer(i, 'up')} className="p-1 text-amber-500"><ArrowUp className="w-3 h-3" /></button>
                                            <button onClick={() => movePlayer(i, 'down')} className="p-1 text-amber-500"><ArrowDown className="w-3 h-3" /></button>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-center font-black text-slate-500">{i + 1}</td>
                                    <td className="px-6 py-4 text-white font-bold">{s.playerName}</td>
                                    <td className="px-6 py-4 text-center text-slate-400">{s.matchPoints}</td>
                                    <td className="px-6 py-4 text-center text-emerald-400 font-mono">{s.weightedAverage?.toFixed(3)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${i < byeCount ? 'text-violet-400 bg-violet-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                                            {i < byeCount ? 'Directo' : 'Ajuste'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}