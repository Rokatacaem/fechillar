"use client";

import React, { useActionState, useEffect, useState } from "react";
import { Plus, Loader2, Info, Trophy, LayoutGrid, Clock, Users, MapPin, ImageIcon, Calendar, Target, Hash } from "lucide-react";
import { createTournament, getAllClubs } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface TournamentFormProps {
    canCreateNational: boolean;
}

export function TournamentForm({ canCreateNational }: TournamentFormProps) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(createTournament, null);
    
    // UI State
    const [discipline, setDiscipline] = useState("THREE_BAND");
    const [categoryMode, setCategoryMode] = useState("OPEN");
    const [clubs, setClubs] = useState<{id: string, name: string}[]>([]);
    
    // Configuración dinámica (JSON)
    const [config, setConfig] = useState<any>({
        playerCount: 32,
        waitlistSize: 8,
        waitlistActivation: "AUTOMATIC",
        groupFormat: "RR_3",
        advancingCount: 2,
        inningsPerPhase: 30,
        bracketSize: 16,
        timeControl: "NONE"
    });

    useEffect(() => {
        const fetchClubs = async () => {
            const data = await getAllClubs();
            setClubs(data);
        };
        fetchClubs();
    }, []);

    useEffect(() => {
        if (state?.success) {
            toast.success("Torneo creado con éxito", {
                description: "Redirigiendo al listado...",
                icon: <Trophy className="w-5 h-5 text-emerald-500" />
            });
            setTimeout(() => router.push("/tournaments"), 2000);
        } else if (state?.error) {
            toast.error("Error al crear torneo", {
                description: state.error
            });
        }
    }, [state, router]);

    const updateConfig = (key: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <form action={formAction} className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md shadow-2xl space-y-10">
            {/* Campo oculto para el config JSON */}
            <input type="hidden" name="config" value={JSON.stringify(config)} />

            {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h2 className="text-sm font-black text-white uppercase tracking-tighter">Información General</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre de la Competencia</label>
                        <input 
                            name="name" 
                            defaultValue={state?.fields?.name || ""}
                            placeholder="Ej. Campeonato Nacional Apertura 2026" 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold" 
                            required 
                        />
                    </div>

                    {/* Disciplina */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Disciplina</label>
                        <select 
                            name="discipline" 
                            value={discipline}
                            onChange={(e) => setDiscipline(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                            required
                        >
                            <option value="THREE_BAND">3 Bandas (Carambola)</option>
                            <option value="POOL_CHILENO">Pool Chileno (15 bolas)</option>
                            <option value="POOL_8">Bola 8</option>
                            <option value="POOL_9">Bola 9</option>
                            <option value="POOL_10">Bola 10</option>
                            <option value="HAYBALL">Heyball</option>
                            <option value="SNOOKER">Snooker</option>
                        </select>
                    </div>

                    {/* Tipo (Handicap) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Torneo</label>
                        <select 
                            name="type" 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                            onChange={(e) => updateConfig("modality", e.target.value)}
                        >
                            <option value="NO_HANDICAP">Sin Hándicap</option>
                            <option value="HANDICAP">Con Hándicap</option>
                        </select>
                    </div>

                    {/* Categoría y Subselector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoría</label>
                        <select 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                            value={categoryMode}
                            onChange={(e) => setCategoryMode(e.target.value)}
                        >
                            <option value="OPEN">Abierto</option>
                            <option value="BY_SERIES">Por Serie</option>
                        </select>
                    </div>

                    <AnimatePresence mode="wait">
                        {categoryMode === "BY_SERIES" ? (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-2"
                            >
                                <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Seleccionar Serie</label>
                                <select 
                                    name="category"
                                    className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                                >
                                    <option value="MASTER">Maestros / Pro</option>
                                    <option value="HONOR">Honor</option>
                                    <option value="FIRST">Primera</option>
                                    <option value="SECOND">Segunda</option>
                                    <option value="THIRD">Tercera</option>
                                    <option value="FOURTH">Cuarta</option>
                                    <option value="FIFTH_A">Quinta A</option>
                                    <option value="FIFTH_B">Quinta B</option>
                                </select>
                            </motion.div>
                        ) : (
                            <input type="hidden" name="category" value="MASTER" />
                        )}
                    </AnimatePresence>

                    {/* Publicación */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado de Publicación</label>
                        <select 
                            name="status" 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                        >
                            <option value="DRAFT">Borrador (Pruebas)</option>
                            <option value="UPCOMING">Anunciado (Preventa)</option>
                        </select>
                    </div>

                    {/* Alcance */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alcance</label>
                        <select 
                            name="scope" 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                        >
                            <option value="INTERNAL">Interno (Club)</option>
                            {canCreateNational && (
                                <option value="NATIONAL">Nacional (Federado)</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: SEDE Y FECHAS */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h2 className="text-sm font-black text-white uppercase tracking-tighter">Sede y Calendario</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Club Anfitrión */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Club Anfitrión</label>
                        <select 
                            name="venueClubId"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                        >
                            <option value="">Seleccionar Club...</option>
                            {clubs.map(club => (
                                <option key={club.id} value={club.id}>{club.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Lugar Físico */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recinto / Lugar Físico</label>
                        <input 
                            name="venueAddress" 
                            placeholder="Ej. Gimnasio Municipal, Sala Principal..." 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" 
                        />
                    </div>

                    {/* Fechas */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Fecha Inicio
                        </label>
                        <input 
                            type="date"
                            name="startDate" 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono [color-scheme:dark]" 
                            required 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Fecha Término
                        </label>
                        <input 
                            type="date"
                            name="endDate" 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono [color-scheme:dark]" 
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: CONFIGURACIÓN DINÁMICA (3 BANDAS) */}
            <AnimatePresence mode="wait">
                {discipline === "THREE_BAND" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6 pt-6 border-t border-emerald-500/20"
                    >
                        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Target className="w-4 h-4 text-emerald-500" />
                            </div>
                            <h2 className="text-sm font-black text-white uppercase tracking-tighter">Parámetros 3 Bandas</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Jugadores */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Capacidad Total
                                </label>
                                <input 
                                    type="number" 
                                    name="capacity"
                                    value={config.playerCount || ""}
                                    onChange={(e) => updateConfig("playerCount", parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                                />
                            </div>

                            {/* Lista Espera */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lista de Espera</label>
                                <input 
                                    type="number" 
                                    name="waitingListLimit"
                                    value={config.waitlistSize || ""}
                                    onChange={(e) => updateConfig("waitlistSize", parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50"
                                />
                            </div>

                            {/* Activación Espera */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activación Espera</label>
                                <select 
                                    value={config.waitlistActivation}
                                    onChange={(e) => updateConfig("waitlistActivation", e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer" 
                                >
                                    <option value="AUTOMATIC">Automática</option>
                                    <option value="MANUAL">Manual (Admin)</option>
                                </select>
                            </div>

                            {/* Formato Grupos */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <LayoutGrid className="w-3 h-3" /> Formato Grupos
                                </label>
                                <select 
                                    value={config.groupFormat}
                                    onChange={(e) => updateConfig("groupFormat", e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer" 
                                >
                                    <option value="RR_3">Round Robin (3 Jugadores)</option>
                                    <option value="DE_4">Doble Eliminación (4 Jugadores)</option>
                                </select>
                            </div>

                            {/* Avance */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clasifican por Grupo</label>
                                <select 
                                    value={config.advancingCount}
                                    onChange={(e) => updateConfig("advancingCount", parseInt(e.target.value))}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer" 
                                >
                                    <option value={1}>1 Jugador</option>
                                    <option value={2}>2 Jugadores</option>
                                </select>
                            </div>

                            {/* Tamaño Cuadro Final */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Trophy className="w-3 h-3" /> Tamaño Cuadro Final
                                </label>
                                <select 
                                    value={config.bracketSize}
                                    onChange={(e) => updateConfig("bracketSize", parseInt(e.target.value))}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer" 
                                >
                                    <option value={8}>Cuadro de 8 (1/4 Final)</option>
                                    <option value={16}>Cuadro de 16 (1/8 Final)</option>
                                    <option value={32}>Cuadro de 32 (1/16 Final)</option>
                                    <option value={64}>Cuadro de 64 (1/32 Final)</option>
                                </select>
                                <p className="text-[9px] text-slate-600 italic">El sistema usará esto para determinar si se requiere Fase de Ajuste.</p>
                            </div>

                            {/* Entradas */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Hash className="w-3 h-3" /> Entradas por Fase
                                    {(config.modality === "HANDICAP") && (
                                        <span className="text-[8px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-md font-black tracking-widest">
                                            FIJO · No cambia en torneo
                                        </span>
                                    )}
                                </label>
                                <input 
                                    type="number" 
                                    value={config.inningsPerPhase || ""}
                                    onChange={(e) => updateConfig("inningsPerPhase", parseInt(e.target.value) || 0)}
                                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-white outline-none focus:ring-1 transition-all ${
                                        config.modality === "HANDICAP"
                                            ? "border-violet-500/30 focus:ring-violet-500/50"
                                            : "border-white/10 focus:ring-emerald-500/50"
                                    }`}
                                />
                                {config.modality === "HANDICAP" && (
                                    <p className="text-[9px] text-violet-400/60 italic">
                                        Con hándicap, este valor se aplica a todas las fases y no puede modificarse durante el torneo.
                                    </p>
                                )}
                            </div>


                            {/* Control de Tiempo */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Control de Tiempo
                                </label>
                                <select 
                                    name="timeControlMode"
                                    value={config.timeControl}
                                    onChange={(e) => updateConfig("timeControl", e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer" 
                                >
                                    <option value="NONE">Sin Reloj</option>
                                    <option value="SHOT_CLOCK">Reloj por Tiro</option>
                                    <option value="MATCH_TOTAL">Tiempo Total x Partida</option>
                                </select>
                            </div>

                            {/* Parámetros de Tiempo (Condicionales) */}
                            <AnimatePresence>
                                {config.timeControl === "SHOT_CLOCK" && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-2 gap-4 md:col-span-1"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Segundos x Tiro</label>
                                            <input 
                                                type="number" 
                                                name="secondsPerShot"
                                                defaultValue={40}
                                                className="w-full bg-slate-950 border border-emerald-500/20 rounded-lg px-3 py-2 text-white text-xs outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Extensiones</label>
                                            <input 
                                                type="number" 
                                                name="extensionsPerPlayer"
                                                defaultValue={2}
                                                className="w-full bg-slate-950 border border-emerald-500/20 rounded-lg px-3 py-2 text-white text-xs outline-none"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Logo Sede */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Logotipo del Club Sede (Opcional)
                                </label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="w-full bg-slate-950 border border-dashed border-white/10 rounded-xl px-4 py-2 text-xs text-slate-500 cursor-pointer file:bg-emerald-500 file:border-none file:px-3 file:py-1 file:rounded-lg file:text-slate-950 file:font-bold file:mr-4 hover:border-emerald-500/30 transition-colors"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pt-8 border-t border-white/5 flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-12 py-5 rounded-2xl font-black transition-all flex items-center gap-3 shadow-2xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            PROCESANDO...
                        </>
                    ) : (
                        <>
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            CREAR COMPETENCIA
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
