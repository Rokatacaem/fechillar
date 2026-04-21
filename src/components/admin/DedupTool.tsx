"use client";

import { useState } from "react";
import { findDuplicatePlayers, mergePlayerProfiles, deletePlayerProfile, DuplicateGroup } from "@/actions/dedup-actions";
import { Copy, Merge, Trash2, Loader2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, User, Users } from "lucide-react";
import { toast } from "sonner";

export function DedupTool() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);

    const scan = async () => {
        setLoading(true);
        const result = await findDuplicatePlayers();
        setGroups(result);
        setLoading(false);
    };

    const handleMerge = async (keepId: string, deleteId: string, groupKey: string) => {
        setProcessing(deleteId);
        const res = await mergePlayerProfiles(keepId, deleteId);
        if (res.success) {
            toast.success("Perfiles fusionados correctamente");
            setGroups(prev => prev ? prev.map(g => g.key === groupKey
                ? { ...g, players: g.players.filter(p => p.id !== deleteId) }
                : g
            ).filter(g => g.players.length > 1) : prev);
        } else {
            toast.error(res.error);
        }
        setProcessing(null);
    };

    const handleDelete = async (id: string, groupKey: string) => {
        setProcessing(id);
        const res = await deletePlayerProfile(id);
        if (res.success) {
            toast.success("Perfil eliminado");
            setGroups(prev => prev ? prev.map(g => g.key === groupKey
                ? { ...g, players: g.players.filter(p => p.id !== id) }
                : g
            ).filter(g => g.players.length > 1) : prev);
        } else {
            toast.error(res.error);
        }
        setProcessing(null);
    };

    return (
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Copy className="w-4 h-4 text-amber-400" />
                    <div className="text-left">
                        <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Detección de Duplicados</p>
                        <p className="text-[9px] text-slate-500">Encuentra y fusiona jugadores repetidos del padrón</p>
                    </div>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {open && (
                <div className="px-5 pb-5 space-y-4 border-t border-white/5">
                    <button
                        onClick={scan}
                        disabled={loading}
                        className="w-full mt-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-black uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                        {loading ? "Escaneando padrón..." : "Escanear duplicados"}
                    </button>

                    {groups !== null && (
                        groups.length === 0 ? (
                            <div className="flex items-center gap-2 py-4 text-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                <p className="text-sm text-emerald-400 font-bold">Sin duplicados detectados</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest">
                                    {groups.length} grupo(s) con duplicados
                                </p>
                                {groups.map(group => (
                                    <div key={group.key} className="bg-slate-950/60 border border-amber-500/10 rounded-xl p-4 space-y-3">
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">
                                            {group.key}
                                        </p>
                                        {group.players.map((player, idx) => {
                                            const isFirst = idx === 0;
                                            const otherPlayer = group.players.find(p => p.id !== player.id);
                                            const isProcessing = processing === player.id;

                                            return (
                                                <div key={player.id} className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border shrink-0 ${
                                                        player.hasUser
                                                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                                            : "bg-slate-800 border-white/10 text-slate-400"
                                                    }`}>
                                                        {player.displayName.charAt(0)}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-white truncate">{player.displayName}</p>
                                                        <p className="text-[9px] text-slate-500 truncate">
                                                            {player.club}
                                                            {player.rut && ` · ${player.rut}`}
                                                            {player.hasUser && <span className="text-emerald-500 ml-1">· Con cuenta</span>}
                                                        </p>
                                                    </div>

                                                    {/* Acciones */}
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {otherPlayer && (
                                                            <button
                                                                onClick={() => handleMerge(otherPlayer.id, player.id, group.key)}
                                                                disabled={!!processing}
                                                                title="Fusionar → conservar el otro"
                                                                className="flex items-center gap-1 px-2 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 text-[9px] font-black uppercase rounded-lg transition-all disabled:opacity-40"
                                                            >
                                                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Merge className="w-3 h-3" />}
                                                                Fusionar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(player.id, group.key)}
                                                            disabled={!!processing}
                                                            title="Eliminar este perfil"
                                                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40"
                                                        >
                                                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="bg-amber-500/5 rounded-lg px-3 py-2 flex items-start gap-2">
                                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                            <p className="text-[9px] text-amber-300/70 leading-relaxed">
                                                <strong>Fusionar</strong>: conserva el primer perfil y traspasa el historial del segundo.
                                                <strong> Eliminar</strong>: borra el perfil si no tiene partidas registradas.
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
