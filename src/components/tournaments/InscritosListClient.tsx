"use client";

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import { Search, X, UserPlus, CheckCircle, Clock, Loader2, Library, ChevronRight, Square, CheckSquare } from "lucide-react";
import { PaymentValidateButton } from "@/components/tournaments/PaymentValidateButton";
import { RemoveRegistrationButton } from "@/components/tournaments/RemoveRegistrationButton";
import { searchPlayers, getPlayersByClub } from "@/app/(sgf)/players/actions";
import { registerPlayer, registerPlayersBulk, updatePlayerAvailability } from "@/app/(sgf)/tournaments/inscripciones/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InscritoData {
    id: string;
    status: string;
    paymentStatus: string;
    amountPaid: number | null;
    paymentRef: string | null;
    registeredPoints: number;
    preferredTurn: string;
    rankingAverage: number | null;
    player: {
        user: { name: string } | null;
        firstName: string | null;
        lastName: string | null;
        rut: string | null;
        federationId: string | null;
        club: { id: string; name: string } | null;
    };
}

interface SearchResult {
    id: string;
    name: string;
    club: string;
    rut: string | null;
}

interface InscritosListClientProps {
    registrations: InscritoData[];
    tournamentId: string;
    allClubs: { id: string, name: string }[];
    hasGroups?: boolean;
    // registrationFee?: number;
}

export function InscritosListClient({ 
    registrations, 
    tournamentId, 
    allClubs, 
    hasGroups = false,
    // registrationFee = 30000 
}: InscritosListClientProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
    const [mode, setMode] = useState<"filter" | "add" | "bulk">(registrations.length === 0 ? "add" : "filter");

    // Modo Agregar individual
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [selectedTurn, setSelectedTurn] = useState("T1");

    // Modo Masivo (Bulk)
    const [selectedClubId, setSelectedClubId] = useState("");
    const [clubPlayers, setClubPlayers] = useState<any[]>([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

    const [isPending, startTransition] = useTransition();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // IDs ya inscritos para excluirlos del resultado de búsqueda
    const enrolledIds = useMemo(() => new Set(
        // We don't have direct playerId here, but registrations have player data
        // We'll compare by display name — workaround since we don't expose playerId directly
        registrations.map(r => r.id) // this is registrationId, not playerId
    ), [registrations]);

    // --- Filtrado local (modo filter) ---
    const clubs = useMemo(() => {
        const seen = new Map<string, string>();
        registrations.forEach(r => {
            if (r.player.club) seen.set(r.player.club.id, r.player.club.name);
            else seen.set("__libre__", "Jugador Libre");
        });
        return Array.from(seen.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [registrations]);

    const filtered = useMemo(() => {
        if (mode === "add") return registrations; // en modo add no filtrar
        return registrations.filter(reg => {
            const name = getDisplayName(reg);
            if (query && !name.toLowerCase().includes(query.toLowerCase())) return false;
            if (selectedClubs.length > 0) {
                const clubId = reg.player.club?.id ?? "__libre__";
                if (!selectedClubs.includes(clubId)) return false;
            }
            return true;
        });
    }, [registrations, query, selectedClubs, mode]);

    // --- Búsqueda en padrón nacional (modo add) ---
    useEffect(() => {
        if (mode !== "add") return;
        if (!query || query.length < 2) { setSearchResults([]); return; }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await searchPlayers(query);
                setSearchResults(res as SearchResult[]);
            } finally {
                setSearching(false);
            }
        }, 300);
    }, [query, mode]);

    // IDs ya inscritos para excluirlos
    const registeredPlayerIds = useMemo(() => new Set(
        registrations.map(r => (r as any).playerId)
    ), [registrations]);

    // Cambiar modo limpia la query
    const switchMode = (m: "filter" | "add" | "bulk") => {
        setMode(m);
        setQuery("");
        setSearchResults([]);
        setSelectedClubs([]);
        setSelectedClubId("");
        setClubPlayers([]);
        setSelectedPlayerIds(new Set());
    };

    // --- Efecto Carga de Jugadores por Club ---
    useEffect(() => {
        if (mode !== "bulk" || !selectedClubId) return;
        
        async function load() {
            setLoadingPlayers(true);
            try {
                const res = await getPlayersByClub(selectedClubId);
                // Filtrar los que ya están en el torneo
                const available = res.filter(p => !registeredPlayerIds.has(p.id));
                setClubPlayers(available);
            } finally {
                setLoadingPlayers(false);
            }
        }
        load();
    }, [selectedClubId, mode, registeredPlayerIds]);

    const handleAdd = async (playerId: string) => {
        setAddingId(playerId);
        try {
            const res = await registerPlayer(tournamentId, playerId, selectedTurn);
            if (res.success) {
                toast.success("Jugador inscrito correctamente");
                setQuery("");
                setSearchResults([]);
                startTransition(() => router.refresh());
            } else {
                toast.error((res as any).error ?? "Error al inscribir");
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setAddingId(null);
        }
    };

    const handleBulkRegister = async () => {
        if (selectedPlayerIds.size === 0) return;
        
        startTransition(async () => {
            const res = await registerPlayersBulk(tournamentId, Array.from(selectedPlayerIds));
            if (res.success) {
                toast.success(`${res.addedCount} jugadores inscritos exitosamente`);
                switchMode("filter");
                router.refresh();
            } else {
                toast.error(res.error || "Fallo en el registro masivo");
            }
        });
    };

    const togglePlayerSelect = (id: string) => {
        const next = new Set(selectedPlayerIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedPlayerIds(next);
    };

    const toggleClub = (clubId: string) =>
        setSelectedClubs(prev =>
            prev.includes(clubId) ? prev.filter(c => c !== clubId) : [...prev, clubId]
        );

    const formatAvg = (avg: number | null) =>
        avg != null && avg > 0 ? avg.toFixed(3) : "—";

    return (
        <div className="space-y-0">
            {/* ── Barra de búsqueda unificada ── */}
            <div className="p-4 space-y-3 border-b border-white/5">
                {/* Toggle modo */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-950/60 rounded-xl p-1 border border-white/5 text-[9px] font-black uppercase tracking-widest overflow-hidden">
                        <button
                            onClick={() => switchMode("filter")}
                            className={["px-3 py-1.5 rounded-lg transition-all", mode === "filter"
                                ? "bg-slate-700 text-white"
                                : "text-slate-500 hover:text-slate-300"].join(" ")}
                        >
                            Ver inscritos
                        </button>
                        <button
                            onClick={() => switchMode("add")}
                            className={["px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5", mode === "add"
                                ? "bg-amber-600 text-white"
                                : "text-slate-500 hover:text-slate-300"].join(" ")}
                        >
                            <UserPlus className="w-3 h-3" /> Agregar individual
                        </button>
                        <button
                            onClick={() => switchMode("bulk")}
                            className={["px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5", mode === "bulk"
                                ? "bg-emerald-600 text-white"
                                : "text-slate-500 hover:text-slate-300"].join(" ")}
                        >
                            <Library className="w-3 h-3" /> Ingreso por Club
                        </button>
                    </div>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest ml-auto">
                        {filtered.length} / {registrations.length} jugadores
                    </span>
                </div>

                {/* --- MODO: AGREGAR INDIVIDUAL --- */}
                {mode === "add" && (
                    <div className="relative">
                        {searching
                            ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
                            : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        }
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar en padrón nacional por nombre o RUT..."
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-white/5 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/30 transition-colors"
                        />
                        {query && (
                            <button onClick={() => { setQuery(""); setSearchResults([]); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Selector de Turno Obligatorio */}
                        <div className="mt-3 flex items-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-amber-500" /> Turno para inscripción:
                            </span>
                            <div className="flex bg-slate-950 rounded-lg p-1 border border-white/5 gap-1">
                                {[
                                    { id: "T1", label: "T1: 10-13h", color: "text-blue-400" },
                                    { id: "T2", label: "T2: 13-18h", color: "text-amber-400" },
                                    { id: "T3", label: "T3: 18-21h", color: "text-emerald-400" },
                                    { id: "TOTAL", label: "TOTAL (Wildcard)", color: "text-purple-400" }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTurn(t.id)}
                                        className={["px-3 py-1 rounded-md text-[9px] font-black transition-all", 
                                            selectedTurn === t.id ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-400"
                                        ].join(" ")}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dropdown resultados modo ADD - Mejorado para no entorpecer visualización */}
                        {searchResults.length > 0 && (
                            <div
                                ref={dropdownRef}
                                className="absolute top-full left-0 right-0 mt-2 bg-[#0d1526] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto ring-1 ring-black/50"
                            >
                                {searchResults.map(p => (
                                    <div key={p.id}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                        <div>
                                            <p className="text-white font-bold text-sm">{p.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                {p.club}{p.rut ? ` · ${p.rut}` : ""}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleAdd(p.id)}
                                            disabled={addingId === p.id || registeredPlayerIds.has(p.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase rounded-lg transition-all disabled:opacity-30"
                                        >
                                            {registeredPlayerIds.has(p.id) ? (
                                                <><CheckCircle className="w-3 h-3" /> Inscrito</>
                                            ) : addingId === p.id ? (
                                                <><Loader2 className="w-3 h-3 animate-spin" /> Inscribiendo</>
                                            ) : (
                                                <><UserPlus className="w-3 h-3" /> Inscribir</>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {query.length >= 2 && !searching && searchResults.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1526] border border-white/10 rounded-2xl shadow-2xl z-50 px-4 py-3 text-center">
                                <p className="text-slate-500 text-sm">Sin resultados en el padrón.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- MODO: INGRESO POR CLUB (BULK) --- */}
                {mode === "bulk" && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col md:flex-row gap-3">
                            <select
                                value={selectedClubId}
                                onChange={e => setSelectedClubId(e.target.value)}
                                className="flex-1 bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/30 transition-colors"
                            >
                                <option value="">— Seleccionar Club —</option>
                                {allClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            
                            <button
                                onClick={handleBulkRegister}
                                disabled={selectedPlayerIds.size === 0 || isPending}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Inscribir Seleccionados ({selectedPlayerIds.size})
                            </button>
                        </div>

                        {/* Listado de jugadores del club */}
                        {selectedClubId && (
                            <div className="bg-slate-950/40 border border-white/5 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto">
                                {loadingPlayers ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                                        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Cargando jugadores...</p>
                                    </div>
                                ) : clubPlayers.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 text-xs uppercase tracking-widest font-bold">
                                        Todos los jugadores de este club ya están inscritos o no hay jugadores registrados.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {clubPlayers.map(p => {
                                            const isSelected = selectedPlayerIds.has(p.id);
                                            return (
                                                <div 
                                                    key={p.id}
                                                    onClick={() => togglePlayerSelect(p.id)}
                                                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-slate-700 shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-bold text-sm truncate">{p.name}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                                            {p.rut ? `RUT: ${p.rut}` : "Sin RUT registrado"}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-800" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- MODO: FILTRAR (BUSCAR INSCRITOS) --- */}
                {mode === "filter" && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar entre inscritos..."
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-white/5 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-slate-500/30 transition-colors"
                        />
                        {query && (
                            <button onClick={() => setQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Chips de club (solo en modo filter) */}
                {mode === "filter" && clubs.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                        {clubs.map(club => {
                            const active = selectedClubs.includes(club.id);
                            return (
                                <button
                                    key={club.id}
                                    onClick={() => toggleClub(club.id)}
                                    className={["px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                                        active
                                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                            : "bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300"
                                    ].join(" ")}
                                >
                                    {club.name}
                                    {active && <X className="inline w-2.5 h-2.5 ml-1" />}
                                </button>
                            );
                        })}
                        {selectedClubs.length > 0 && (
                            <button
                                onClick={() => setSelectedClubs([])}
                                className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Lista de inscritos ── */}
            {filtered.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-slate-500 text-sm">
                        {registrations.length === 0 
                            ? "Aún no hay jugadores inscritos. Usa el botón 'Agregar participante' para comenzar." 
                            : "No se encontraron jugadores inscritos con los filtros aplicados."}
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                    {filtered.map((reg, idx) => {
                        const name = getDisplayName(reg);
                        const initial = (reg.player.user?.name || reg.player.firstName || "?").charAt(0).toUpperCase();
                        return (
                            <div key={reg.id}
                                className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                {/* Posición + avatar + nombre */}
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-700 w-5 text-right shrink-0">{idx + 1}</span>
                                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10 shrink-0 text-sm">
                                        {initial}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm leading-tight">{name}</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5">
                                            {reg.player.club?.name || "JUGADOR LIBRE"}
                                            {reg.player.rut ? ` · RUT ${reg.player.rut}`
                                                : reg.player.federationId ? ` · ID ${reg.player.federationId.slice(0, 8)}`
                                                    : ""}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    {/* Turno - Edición en Línea */}
                                    <div className="hidden lg:flex flex-col items-end gap-1 min-w-[100px] border-r border-white/5 pr-5">
                                        <select
                                            value={reg.preferredTurn || "T1"}
                                            disabled={hasGroups}
                                            title={hasGroups ? "No se puede cambiar el turno con grupos ya generados. Elimine los grupos para editar." : ""}
                                            onChange={async (e) => {
                                                const newTurn = e.target.value;
                                                const res = await updatePlayerAvailability(reg.id, newTurn);
                                                if (res.success) {
                                                    toast.success("Turno actualizado");
                                                    router.refresh();
                                                } else {
                                                    toast.error(res.error || "Error al actualizar turno");
                                                }
                                            }}
                                            className={["bg-transparent border-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer text-right disabled:opacity-30 disabled:cursor-not-allowed",
                                                reg.preferredTurn === "T1" ? "text-blue-400" :
                                                reg.preferredTurn === "T2" ? "text-amber-400" :
                                                reg.preferredTurn === "T3" ? "text-emerald-400" :
                                                "text-purple-400"
                                            ].join(" ")}
                                        >
                                            <option value="T1" className="bg-slate-900 text-blue-400">T1: 10:00 - 13:00</option>
                                            <option value="T2" className="bg-slate-900 text-amber-400">T2: 13:00 - 18:00</option>
                                            <option value="T3" className="bg-slate-900 text-emerald-400">T3: 18:00 - 21:00</option>
                                            <option value="TOTAL" className="bg-slate-900 text-purple-400">DISPONIBILIDAD TOTAL</option>
                                        </select>
                                        <p className="text-[9px] uppercase tracking-widest text-slate-600">
                                            {hasGroups ? "GRUPO FIJO" : "Disponibilidad"}
                                        </p>
                                    </div>

                                    {/* Pago */}
                                    <div className="text-right border-r border-white/5 pr-5 hidden md:block min-w-[100px]">
                                        {reg.paymentStatus === "PAID" ? (
                                            <div>
                                                <p className="text-emerald-400 font-black text-sm">
                                                    {reg.amountPaid
                                                        ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(reg.amountPaid)
                                                        : "PAGADO"}
                                                </p>
                                                <p className="text-[9px] uppercase tracking-widest text-slate-500">Ref: {reg.paymentRef}</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-yellow-500 font-bold text-[10px] uppercase tracking-widest">PENDIENTE</p>
                                                <PaymentValidateButton 
                                                    registrationId={reg.id} 
                                                    amount={30000}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Promedio */}
                                    <div className="text-right hidden sm:block min-w-[56px]">
                                        <p className="text-white font-black text-sm">{formatAvg(reg.rankingAverage)}</p>
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500">Promedio</p>
                                    </div>

                                    {/* Estado */}
                                    {reg.status === "APPROVED"
                                        ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                        : <Clock className="w-5 h-5 text-yellow-500 shrink-0" />
                                    }

                                    <RemoveRegistrationButton registrationId={reg.id} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function getDisplayName(reg: InscritoData) {
    return reg.player.user?.name ||
        `${reg.player.firstName || ""} ${reg.player.lastName || ""}`.trim() ||
        "Sin nombre";
}
