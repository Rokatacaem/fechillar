"use client";

import { useState, useTransition } from "react";
import { Shuffle, Loader2, GripVertical, Edit2, Check, X, Users, AlertTriangle, ArrowRightLeft, ChevronUp, ChevronDown } from "lucide-react";
import { generateGroups, movePlayerToGroup, renameGroup, movePlayerOrder } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PlayerData {
    id: string;
    firstName: string | null;
    lastName: string | null;
    user: { name: string } | null;
    club: { name: string } | null;
    rankings: { average: number | null; points: number }[];
}

interface RegData {
    id: string;
    registeredPoints: number;
    player: PlayerData;
}

interface GroupData {
    id: string;
    name: string;
    registrations: RegData[];
}

interface Props {
    tournamentId: string;
    groups: GroupData[];
    unassigned: RegData[];
    isAdmin: boolean;
}

export function GroupsEditor({ tournamentId, groups: initialGroups, unassigned: initialUnassigned, isAdmin }: Props) {
    const router = useRouter();
    const [groups, setGroups] = useState<GroupData[]>(initialGroups);
    const [unassigned, setUnassigned] = useState<RegData[]>(initialUnassigned);
    const [generating, setGenerating] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Estado para mover jugador
    const [moving, setMoving] = useState<{ regId: string; fromGroupId: string | null } | null>(null);
    const [movingTo, setMovingTo] = useState<string | null>(null);

    // Estado para renombrar grupo
    const [editingGroup, setEditingGroup] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    const playerName = (p: PlayerData) =>
        p.user?.name || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Sin nombre";

    const handleGenerate = async () => {
        if (groups.length > 0) {
            const ok = confirm("⚠️ ATENCIÓN: Al regenerar los grupos se borrarán todas las asignaciones y cambios manuales actuales. ¿Estás seguro de que deseas continuar?");
            if (!ok) return;
        }
        setGenerating(true);
        toast.loading("Generando grupos, por favor espera...", { id: "generate-groups" });
        try {
            const res = await generateGroups(tournamentId);
            if (res.success) {
                toast.success(`✅ ${res.numGroups} grupos generados con ${res.total} jugadores`, { id: "generate-groups" });
                startTransition(() => router.refresh());
            } else {
                toast.error(`Error: ${res.error}`, { id: "generate-groups" });
            }
        } catch (e: any) {
            toast.error(`Error inesperado: ${e.message}`, { id: "generate-groups" });
        } finally {
            setGenerating(false);
        }
    };

    const handleMove = async (regId: string, fromGroupId: string | null, toGroupId: string | null) => {
        if (fromGroupId === toGroupId) return;
        setMovingTo(toGroupId);
        const res = await movePlayerToGroup(regId, toGroupId);
        if (res.success) {
            // Actualizar estado local
            const reg = [...groups.flatMap(g => g.registrations), ...unassigned].find(r => r.id === regId)!;

            setGroups(prev => prev.map(g => {
                if (g.id === fromGroupId) return { ...g, registrations: g.registrations.filter(r => r.id !== regId) };
                if (g.id === toGroupId) return { ...g, registrations: [...g.registrations, reg] };
                return g;
            }));

            if (fromGroupId === null) setUnassigned(prev => prev.filter(r => r.id !== regId));
            if (toGroupId === null) setUnassigned(prev => [...prev, reg]);

            toast.success("Jugador movido");
        } else {
            toast.error(res.error);
        }
        setMoving(null);
        setMovingTo(null);
    };

    const handleRename = async (groupId: string) => {
        if (!editName.trim()) return;
        const res = await renameGroup(groupId, editName);
        if (res.success) {
            setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: editName.trim() } : g));
            toast.success("Grupo renombrado");
        } else {
            toast.error(res.error);
        }
        setEditingGroup(null);
    };
    
    const handleReorder = async (regId: string, direction: "up" | "down") => {
        const res = await movePlayerOrder(regId, direction);
        if (res.success) {
            startTransition(() => router.refresh());
            toast.success("Orden actualizado");
        } else {
            toast.error(res.error);
        }
    };

    const startMove = (regId: string, fromGroupId: string | null) => {
        if (moving?.regId === regId) { setMoving(null); return; }
        setMoving({ regId, fromGroupId });
    };

    // Colores por grupo
    const groupColors = [
        "emerald", "violet", "amber", "blue", "rose", "cyan",
        "orange", "indigo", "pink", "teal", "lime", "red"
    ];
    const gc = (idx: number) => groupColors[idx % groupColors.length];

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            {isAdmin && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {moving && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-bold">
                                <ArrowRightLeft className="w-4 h-4" />
                                Selecciona el grupo destino
                                <button onClick={() => setMoving(null)} className="ml-2 text-amber-600 hover:text-amber-400">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-violet-500/20"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                        {generating ? "Generando..." : groups.length > 0 ? "Regenerar Grupos" : "Generar Grupos"}
                    </button>
                </div>
            )}

            {/* Sin grupos */}
            {groups.length === 0 && (
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-16 text-center space-y-4">
                    <Shuffle className="w-12 h-12 text-slate-700 mx-auto" />
                    <p className="text-slate-400 font-bold">No se han generado grupos aún.</p>
                    <p className="text-slate-600 text-sm">
                        Usa el botón "Generar Grupos" para distribuir automáticamente los jugadores
                        usando el método serpentina basado en su ranking de presentación.
                    </p>
                </div>
            )}

            {/* Grid de grupos */}
            {groups.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {groups.map((group, gIdx) => {
                            const color = gc(gIdx);
                            const isTarget = moving && moving.fromGroupId !== group.id;
                            return (
                                <div
                                    key={group.id}
                                    onClick={() => isTarget && moving && handleMove(moving.regId, moving.fromGroupId, group.id)}
                                    className={[
                                        "bg-slate-900/60 border rounded-2xl overflow-hidden transition-all",
                                        isTarget
                                            ? `border-${color}-500/50 ring-2 ring-${color}-500/20 cursor-pointer hover:bg-${color}-500/5`
                                            : "border-white/5"
                                    ].join(" ")}
                                >
                                    {/* Header grupo */}
                                    <div className={`px-4 py-3 bg-${color}-500/10 border-b border-${color}-500/10 flex items-center justify-between`}>
                                        {editingGroup === group.id ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    autoFocus
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    onKeyDown={e => { if (e.key === "Enter") handleRename(group.id); if (e.key === "Escape") setEditingGroup(null); }}
                                                    className="flex-1 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-bold outline-none"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                                <button onClick={e => { e.stopPropagation(); handleRename(group.id); }} className={`text-${color}-400 hover:text-white`}>
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); setEditingGroup(null); }} className="text-slate-500 hover:text-white">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className={`text-xs font-black uppercase tracking-widest text-${color}-400`}>
                                                    {group.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] text-slate-500 font-bold">
                                                        {group.registrations.length} jug.
                                                    </span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setEditingGroup(group.id); setEditName(group.name); }}
                                                            className="text-slate-600 hover:text-slate-300 transition-colors"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Jugadores */}
                                    <div className="divide-y divide-white/5">
                                        {group.registrations.map((reg, rIdx) => {
                                            const isBeingMoved = moving?.regId === reg.id;
                                            const avg = reg.player.rankings?.[0]?.average;
                                            return (
                                                <div
                                                    key={reg.id}
                                                    className={[
                                                        "px-4 py-2.5 flex items-center gap-3 transition-all",
                                                        isBeingMoved ? "bg-amber-500/10" : "hover:bg-white/[0.02]"
                                                    ].join(" ")}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {/* Posición dentro del grupo */}
                                                    <span className="text-[9px] font-black text-slate-700 w-4 shrink-0">{rIdx + 1}</span>

                                                    {/* Avatar */}
                                                    <div className={`w-7 h-7 rounded-full bg-${color}-500/20 border border-${color}-500/20 flex items-center justify-center text-[10px] font-black text-${color}-400 shrink-0`}>
                                                        {playerName(reg.player).charAt(0)}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-bold text-[11px] leading-tight truncate">
                                                            {playerName(reg.player)}
                                                        </p>
                                                        <p className="text-[9px] text-slate-600 truncate">
                                                            {reg.player.club?.name || "Libre"}
                                                        </p>
                                                    </div>

                                                    {/* Promedio */}
                                                    <span className="text-[10px] font-black text-slate-400 shrink-0">
                                                        {avg != null && avg > 0 ? avg.toFixed(2) : "—"}
                                                    </span>

                                                    {/* Botones reordenar */}
                                                    {isAdmin && (
                                                        <div className="flex flex-col gap-0.5">
                                                            <button
                                                                onClick={() => handleReorder(reg.id, "up")}
                                                                disabled={rIdx === 0}
                                                                className="p-0.5 rounded hover:bg-white/10 text-slate-600 hover:text-white disabled:opacity-20"
                                                            >
                                                                <ChevronUp className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReorder(reg.id, "down")}
                                                                disabled={rIdx === group.registrations.length - 1}
                                                                className="p-0.5 rounded hover:bg-white/10 text-slate-600 hover:text-white disabled:opacity-20"
                                                            >
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Botón mover */}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => startMove(reg.id, group.id)}
                                                            title="Mover a otro grupo"
                                                            className={[
                                                                "p-1 rounded transition-colors shrink-0",
                                                                isBeingMoved
                                                                    ? "text-amber-400 bg-amber-500/20"
                                                                    : "text-slate-600 hover:text-amber-400"
                                                            ].join(" ")}
                                                        >
                                                            <ArrowRightLeft className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {group.registrations.length === 0 && (
                                            <div className="px-4 py-4 text-center">
                                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Grupo vacío</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sin grupo asignado */}
                    {unassigned.length > 0 && (
                        <div className={[
                            "bg-slate-900/40 border rounded-2xl overflow-hidden transition-all",
                            moving && moving.fromGroupId !== null
                                ? "border-slate-500/50 ring-2 ring-slate-500/20 cursor-pointer"
                                : "border-white/5"
                        ].join(" ")}
                            onClick={() => moving && moving.fromGroupId !== null && handleMove(moving.regId, moving.fromGroupId, null)}
                        >
                            <div className="px-4 py-3 bg-slate-800/60 border-b border-white/5 flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                                    Sin grupo asignado ({unassigned.length})
                                </span>
                            </div>
                            <div className="p-4 flex flex-wrap gap-2">
                                {unassigned.map(reg => (
                                    <div
                                        key={reg.id}
                                        onClick={e => e.stopPropagation()}
                                        className={[
                                            "flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-white/5 rounded-xl text-xs transition-all",
                                            moving?.regId === reg.id ? "border-amber-500/40 bg-amber-500/10" : ""
                                        ].join(" ")}
                                    >
                                        <span className="text-white font-bold">{playerName(reg.player)}</span>
                                        {isAdmin && (
                                            <button
                                                onClick={() => startMove(reg.id, null)}
                                                className="text-slate-500 hover:text-amber-400 transition-colors"
                                            >
                                                <ArrowRightLeft className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Instrucciones de uso */}
                    {isAdmin && (
                        <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Ajuste Manual</p>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Haz clic en <ArrowRightLeft className="inline w-3 h-3" /> junto al jugador para activar el modo movimiento,
                                luego haz clic en el grupo destino (se resalta en color). Usa <ChevronUp className="inline w-3 h-3" /> y <ChevronDown className="inline w-3 h-3" /> para ajustar la siembra (orden) dentro del grupo.
                                Para editar el nombre del grupo, haz clic en <Edit2 className="inline w-3 h-3" />.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
