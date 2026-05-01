"use client";

import React, { useState, useEffect, useTransition } from "react";
// ✅ FIX APLICADO: Se separan las importaciones según su ubicación real
import { generateKnockoutPhase } from "./actions";
import { getGroupStandings } from "@/lib/tournament-results";

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
        // En modo auditoría, ignoramos el sort de columnas y mantenemos el orden actual del state
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
            // ✅ Ahora llama a la función desde la ruta correcta
            const res = await getGroupStandings(tournamentId);
            if (res.success) {
                setStandings(res.standings || []);
            } else {
                toast.error(res.error);
            }
            setLoading(false);
        }
        load();
    }, [tournamentId]);

    const handleGenerateBrackets = async () => {
        let msg = `¿Estás seguro de generar el cuadro con los ${qCount} mejores clasificados?`;
        if (isAuditMode) msg = `⚠️ ESTÁS EN MODO AUDITORÍA.\nSe ignorará el motor matemático oficial y se utilizará EXACTAMENTE el orden manual que has configurado en pantalla.\n\n¿Deseas continuar?`;

        const ok = confirm(msg);
        if (!ok) return;

        setGenerating(true);
        const customPlayerIds = isAuditMode ? sortedStandings.map(s => s.playerId) : undefined;
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
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-violet-500/20 rounded-xl">
                                <Sparkles className="w-5 h-5 text-violet-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Motor de Cuadros</span>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">TRANSICIÓN A <span className="text-violet-400">ELIMINATORIAS</span></h2>
                        <p className="text-slate-400 font-medium mt-2">Configura el tamaño del cuadro final y verifica los clasificados.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={generating}
                            className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGenerateBrackets}
                            disabled={generating}
                            className="px-8 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                            {generating ? "Generando..." : "Generar Cuadro"} <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                </div>

                {/* Config & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2 bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Parámetros de Clasificación
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">¿Cuántos jugadores clasifican?</label>
                                <div className="flex flex-wrap gap-2">
                                    {[8, 12, 16, 24, 32, 48, 64].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setQCount(n)}
                                            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${qCount === n
                                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                                                    : "bg-slate-800 text-slate-500 hover:text-slate-300"
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-amber-500 bg-slate-800 border-white/10 rounded-md"
                                        checked={isAuditMode}
                                        onChange={(e) => setIsAuditMode(e.target.checked)}
                                    />
                                    <div>
                                        <span className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Activar Modo Auditoría (Forzar Orden Manual)
                                        </span>
                                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                            Al activar esto, se deshabilita el motor oficial de desempates. Podrás usar flechas para reordenar la tabla manualmente y replicar clasificaciones históricas con errores en la planilla original.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {isAdjustmentNeeded && (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex gap-4 mt-6">
                                <div className="p-3 bg-amber-500/20 rounded-2xl h-fit">
                                    <Info className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="text-amber-400 font-black text-sm uppercase tracking-widest">Fase de Ajuste Detectada</h4>
                                    <p className="text-amber-500/80 text-xs font-medium mt-1 leading-relaxed">
                                        Se generará una ronda previa para <span className="font-black text-amber-400">{adjCount * 2}</span> jugadores.
                                        Los <span className="font-black text-amber-400">{byeCount}</span> mejores clasificados pasarán directo (BYE) a la ronda de {P}.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Formato</span>
                                <span className="text-xs font-bold text-white">Single Elimination</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rondas Totales</span>
                                <span className="text-xs font-bold text-white">{Math.log2(P) + (isAdjustmentNeeded ? 1 : 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Partidas Totales</span>
                                <span className="text-xs font-bold text-white">{qCount - 1}</span>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <Trophy className="w-8 h-8" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-slate-500">Campeón Obtiene</p>
                                    <p className="text-lg font-black tracking-tighter text-white">60 PTS NACIONALES</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista Clasificados - Tabla de Auditoría */}
                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" /> Clasificados Sugeridos
                        </h3>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Auditoría de Clasificación</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-slate-950/50">
                                    {isAuditMode && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-500 w-16 text-center">Mover</th>}
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 w-16 text-center">Nº</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center" title="Posición en su propio grupo">POS. GRUPO</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Atleta</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('matchPoints')} title="Puntos de Match">PM</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 text-center cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => handleSort('weightedAverage')} title="Promedio Ponderado">PP</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('generalAverage')} title="Promedio General">PG</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('highRun')} title="Serie Mayor (Tacada)">SM</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Destino</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-slate-900/40">
                                {sortedStandings.slice(0, qCount).map((s, i) => {
                                    const isBye = i < byeCount;
                                    return (
                                        <tr key={s.playerId} className={`hover:bg-slate-800/50 transition-colors group ${isAuditMode ? 'bg-amber-950/10' : ''}`}>
                                            {isAuditMode && (
                                                <td className="px-4 py-4 text-center border-r border-amber-500/10">
                                                    <div className="flex flex-col items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <button disabled={i === 0} onClick={() => movePlayer(i, 'up')} className="p-1 text-amber-500 hover:text-amber-300 hover:bg-amber-500/10 rounded disabled:opacity-30 disabled:hover:bg-transparent">
                                                            <ArrowUp className="w-3 h-3" />
                                                        </button>
                                                        <button disabled={i === sortedStandings.length - 1} onClick={() => movePlayer(i, 'down')} className="p-1 text-amber-500 hover:text-amber-300 hover:bg-amber-500/10 rounded disabled:opacity-30 disabled:hover:bg-transparent">
                                                            <ArrowDown className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                            <td className={`px-6 py-4 text-center text-sm font-black ${i < 3 ? 'text-amber-400' : 'text-slate-600'}`}>{i + 1}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] font-black uppercase bg-white/10 px-2 py-1 rounded-md text-slate-300">
                                                    {s.positionInGroup}º
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-white font-bold text-sm truncate max-w-[200px]">{s.playerName}</p>
                                                <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tighter">{s.clubName}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-300">{s.matchPoints}</td>
                                            <td className="px-6 py-4 text-center text-sm font-black text-emerald-400 bg-emerald-500/5">{s.weightedAverage ? s.weightedAverage.toFixed(3) : "0.000"}</td>
                                            <td className="px-6 py-4 text-center text-sm font-medium text-slate-400">{s.generalAverage.toFixed(3)}</td>
                                            <td className="px-6 py-4 text-center text-sm font-medium text-slate-400">{s.highRun}</td>
                                            <td className="px-6 py-4 text-right">
                                                {isBye ? (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 bg-violet-400/10 border border-violet-500/20 px-3 py-1 rounded-full">Directo</span>
                                                ) : (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-500/20 px-3 py-1 rounded-full">Ajuste</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {sortedStandings.length < qCount && (
                            <div className="p-12 text-center bg-slate-900/90 border-t border-white/5">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Insuficientes jugadores ({sortedStandings.length}/{qCount})</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}