"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, Trophy, Calendar, MapPin, Users, Clock, Info, Phone } from "lucide-react";
import { updateTournament } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InitialData {
    name: string;
    description: string;
    venueAddress: string;
    venueClubId: string;
    startDate: string;
    endDate: string;
    status: string;
    scope: string;
    discipline: string;
    category: string;
    tenantId: string;
    maxTables: number;
    hasTimeLimit: boolean;
    secondsPerShot: number;
    // Config
    groupFormat: string;
    advancingCount: number;
    inningsPerPhase: number;
    playerCount: number;
    hasHandicap: boolean;
    registrationFee: number;
    tables: number;
    turns: number;
    bracketSize: number;
    distanceGroups: number;
    distancePlayoffs: number;
    distanceFinal: number;
    inningsGroups: number;
    inningsPlayoffs: number;
    bankAccountName: string;
    bankAccountRut: string;
    bankName: string;
    bankAccountType: string;
    bankAccountNumber: string;
    bankAccountEmail: string;
    // Lista de espera y contacto
    waitlistSize: number;
    waitlistActivation: string;
    registrationContact: string;
    registrationPhone: string;
    registrationDeadline: string;
    groupsPublishDate: string;
    // Control de tiempo
    timeControlMode: string;
    extensionsPerPlayer: number;
}

interface Props {
    tournamentId: string;
    initialData: InitialData;
    clubs: { id: string; name: string }[];
}

const STATUSES = ["DRAFT", "UPCOMING", "OPEN", "IN_PROGRESS", "FINISHED"];
const SCOPES = ["NATIONAL", "CLUB", "INTERNAL", "EXTERNAL_REFERENCE"];

const fieldClass = "w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/30 transition-colors";
const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block";

export function TournamentEditForm({ tournamentId, initialData, clubs }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState(initialData);

    const set = (key: keyof InitialData, value: any) =>
        setData(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = new FormData(e.target as HTMLFormElement);

        startTransition(async () => {
            const res = await updateTournament(tournamentId, form);
            if (res.success) {
                toast.success("Torneo actualizado correctamente");
                router.push("/tournaments");
            } else {
                toast.error(res.error ?? "Error al guardar");
            }
        });
    };

    const ppg = data.groupFormat === "RR_3" ? 3 : 4;
    const totalGroups = data.tables * data.turns;
    const totalPlayers = totalGroups * ppg;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Información General ── */}
            <Section icon={<Trophy className="w-4 h-4" />} title="Información General">
                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>Nombre del torneo</label>
                        <input name="name" title="Nombre del torneo" defaultValue={data.name} required className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Descripción / Bases</label>
                        <textarea name="description" title="Descripción del torneo" defaultValue={data.description} rows={3}
                            className={fieldClass + " resize-none"} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Disciplina</label>
                            <input title="Disciplina" value={data.discipline} disabled
                                className={fieldClass + " opacity-40 cursor-not-allowed"} />
                            <p className="text-[9px] text-slate-600 mt-1">No modificable tras creación.</p>
                        </div>
                        <div>
                            <label className={labelClass}>Categoría</label>
                            <input title="Categoría" value={data.category} disabled
                                className={fieldClass + " opacity-40 cursor-not-allowed"} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Estado</label>
                            <select name="status" title="Estado del torneo" defaultValue={data.status} className={fieldClass}>
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Alcance</label>
                            <select name="scope" title="Alcance del torneo" defaultValue={data.scope} className={fieldClass}>
                                {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Sede y Fechas ── */}
            <Section icon={<Calendar className="w-4 h-4" />} title="Sede y Fechas">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Fecha de inicio</label>
                        <input type="date" name="startDate" title="Fecha de inicio" defaultValue={data.startDate} required className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Fecha de término</label>
                        <input type="date" name="endDate" title="Fecha de término" defaultValue={data.endDate} className={fieldClass} />
                    </div>
                </div>
                <div className="mt-4">
                    <label className={labelClass}>Club Anfitrión / Sede</label>
                    <select name="venueClubId" title="Club anfitrión" defaultValue={data.venueClubId} className={fieldClass}>
                        <option value="">— Sin club sede —</option>
                        {clubs.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="mt-4">
                    <label className={labelClass}>Recinto / Lugar Físico</label>
                    <input name="venueAddress" defaultValue={data.venueAddress} placeholder="Ej. Av. Colón 1234, Valparaíso" className={fieldClass} />
                </div>
                <input type="hidden" name="tenantId" value={data.tenantId} />
            </Section>

            {/* ── Infraestructura ── */}
            <Section icon={<MapPin className="w-4 h-4" />} title="Infraestructura">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Mesas disponibles</label>
                        <input type="number" name="tables" title="Mesas disponibles" value={data.tables} min={1} max={30}
                            onChange={e => set("tables", parseInt(e.target.value) || 1)}
                            className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Número de turnos</label>
                        <select name="turns" title="Número de turnos" value={data.turns} onChange={e => set("turns", parseInt(e.target.value))} className={fieldClass}>
                            <option value={1}>1 Turno</option>
                            <option value={2}>2 Turnos</option>
                            <option value={3}>3 Turnos</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Mesa máx. admin</label>
                        <input type="number" name="maxTables" title="Máximo de mesas para administración" defaultValue={data.maxTables} min={1} max={30} className={fieldClass} />
                    </div>
                </div>
            </Section>

            {/* ── Configuración de Grupos ── */}
            <Section icon={<Users className="w-4 h-4" />} title="Configuración de Grupos">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Formato de grupos</label>
                        <select name="groupFormat" title="Formato de grupos" value={data.groupFormat}
                            onChange={e => set("groupFormat", e.target.value)}
                            className={fieldClass}>
                            <option value="RR_3">Round Robin — 3 Jugadores</option>
                            <option value="RR_4">Round Robin — 4 Jugadores</option>
                            <option value="DE_4">Doble Eliminación — 4 Jugadores (GSL)</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Clasifican por grupo</label>
                        <select name="advancingCount" title="Clasifican por grupo" value={data.advancingCount}
                            onChange={e => set("advancingCount", parseInt(e.target.value))}
                            className={fieldClass}>
                            <option value={1}>1 Jugador</option>
                            <option value={2}>2 Jugadores</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Total jugadores (cupo)</label>
                        <input type="number" name="playerCount" title="Total de jugadores" value={data.playerCount} min={2} max={256}
                            onChange={e => set("playerCount", parseInt(e.target.value) || 2)}
                            className={fieldClass} />
                        <p className="text-[9px] text-slate-600 mt-1">
                            Capacidad física: {data.tables} × {data.turns} × {ppg} = {totalPlayers} jug.
                        </p>
                    </div>
                    <div>
                        <label className={labelClass}>Tamaño cuadro final</label>
                        <select name="bracketSize" title="Tamaño del cuadro final" value={data.bracketSize}
                            onChange={e => set("bracketSize", parseInt(e.target.value))}
                            className={fieldClass}>
                            <option value={8}>Cuadro de 8</option>
                            <option value={16}>Cuadro de 16</option>
                            <option value={32}>Cuadro de 32</option>
                            <option value={64}>Cuadro de 64</option>
                        </select>
                    </div>
                </div>

                {/* Reglamento por fase */}
                <div className="mt-4 bg-slate-950/40 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reglamento por Fase</span>
                    </div>
                    <div className="grid grid-cols-4 gap-px bg-white/5 text-[10px]">
                        <div className="bg-slate-950 px-3 py-2 font-black text-slate-600 uppercase">Fase</div>
                        <div className="bg-slate-950 px-3 py-2 font-black text-slate-600 uppercase text-center">Carambolas</div>
                        <div className="bg-slate-950 px-3 py-2 font-black text-slate-600 uppercase text-center">Tope Entradas</div>
                        <div className="bg-slate-950 px-3 py-2 font-black text-slate-600 uppercase text-center">Entradas Fase</div>

                        <div className="bg-slate-900/40 px-3 py-2 text-slate-300 font-bold flex items-center">Grupos</div>
                        <div className="bg-slate-900/40 px-2 py-1.5">
                            <input type="number" name="distanceGroups" min={1} title="Carambolas grupos"
                                value={data.distanceGroups} onChange={e => set("distanceGroups", parseInt(e.target.value) || 30)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center outline-none" />
                        </div>
                        <div className="bg-slate-900/40 px-2 py-1.5">
                            <input type="number" name="inningsGroups" min={1} title="Tope entradas grupos"
                                value={data.inningsGroups} onChange={e => set("inningsGroups", parseInt(e.target.value) || 35)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center outline-none" />
                        </div>
                        <div className="bg-slate-900/40 px-2 py-1.5">
                            <input type="number" name="inningsPerPhase" min={1} title="Entradas fase grupos"
                                value={data.inningsPerPhase} onChange={e => set("inningsPerPhase", parseInt(e.target.value) || 30)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center outline-none" />
                        </div>

                        <div className="bg-slate-900/40 px-3 py-2 text-slate-300 font-bold flex items-center">QF / SF</div>
                        <div className="bg-slate-900/40 px-2 py-1.5">
                            <input type="number" name="distancePlayoffs" min={1} title="Carambolas playoffs"
                                value={data.distancePlayoffs} onChange={e => set("distancePlayoffs", parseInt(e.target.value) || 35)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center outline-none" />
                        </div>
                        <div className="bg-slate-900/40 px-2 py-1.5">
                            <input type="number" name="inningsPlayoffs" min={1} title="Tope entradas playoffs"
                                value={data.inningsPlayoffs} onChange={e => set("inningsPlayoffs", parseInt(e.target.value) || 40)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center outline-none" />
                        </div>
                        <div className="bg-slate-900/40 px-2 py-1.5 flex items-center justify-center">
                            <span className="text-slate-600 text-[9px]">—</span>
                        </div>

                        <div className="bg-slate-900/40 px-3 py-2 text-amber-400 font-bold flex items-center">Gran Final</div>
                        <div className="bg-slate-900/40 px-2 py-1.5">
                            <input type="number" name="distanceFinal" min={1} title="Carambolas final"
                                value={data.distanceFinal} onChange={e => set("distanceFinal", parseInt(e.target.value) || 35)}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center outline-none" />
                        </div>
                        <div className="bg-slate-900/40 px-2 py-1.5 flex items-center justify-center">
                            <span className="text-slate-500 text-[9px] italic">Sin límite</span>
                        </div>
                        <div className="bg-slate-900/40 px-2 py-1.5 flex items-center justify-center">
                            <span className="text-slate-600 text-[9px]">—</span>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Inscripciones ── */}
            <Section icon={<Trophy className="w-4 h-4" />} title="Inscripciones y Premios">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Costo de inscripción ($)</label>
                        <input type="number" name="registrationFee" defaultValue={data.registrationFee}
                            min={0} step={1000} placeholder="30000" title="Costo de inscripción en pesos"
                            className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Lista de Espera (cupos)</label>
                        <input type="number" name="waitlistSize" title="Cupos en lista de espera"
                            value={data.waitlistSize} min={0} max={50}
                            onChange={e => set("waitlistSize", parseInt(e.target.value) || 0)}
                            className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Activación Espera</label>
                        <select name="waitlistActivation" title="Modo de activación de lista de espera"
                            value={data.waitlistActivation}
                            onChange={e => set("waitlistActivation", e.target.value)}
                            className={fieldClass}>
                            <option value="AUTOMATIC">Automática</option>
                            <option value="MANUAL">Manual (Admin)</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Cierre de Inscripciones</label>
                        <input type="date" name="registrationDeadline" title="Fecha cierre inscripciones"
                            defaultValue={data.registrationDeadline}
                            className={fieldClass + " [color-scheme:dark]"} />
                    </div>
                    <div>
                        <label className={labelClass}>Publicación de Grupos</label>
                        <input type="date" name="groupsPublishDate" title="Fecha publicación de grupos"
                            defaultValue={data.groupsPublishDate}
                            className={fieldClass + " [color-scheme:dark]"} />
                    </div>
                </div>
            </Section>

            {/* ── Contacto ── */}
            <Section icon={<Phone className="w-4 h-4" />} title="Contacto de Inscripciones">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Nombre del Contacto</label>
                        <input name="registrationContact" title="Nombre del contacto para inscripciones"
                            placeholder="Ej. Juan Pérez" defaultValue={data.registrationContact}
                            className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>WhatsApp de Contacto</label>
                        <input name="registrationPhone" title="WhatsApp o teléfono de contacto"
                            placeholder="+56 9 1234 5678" defaultValue={data.registrationPhone}
                            className={fieldClass} />
                    </div>
                </div>
            </Section>

            {/* ── Datos Bancarios ── */}
            <Section icon={<Info className="w-4 h-4" />} title="Datos Bancarios para Inscripción">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Titular</label>
                        <input name="bankAccountName" title="Titular de la cuenta" placeholder="Nombre del titular" defaultValue={data.bankAccountName} className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>RUT</label>
                        <input name="bankAccountRut" title="RUT del titular" placeholder="12.345.678-9" defaultValue={data.bankAccountRut} className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Banco</label>
                        <input name="bankName" title="Nombre del banco" placeholder="Ej. Banco Estado" defaultValue={data.bankName} className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Tipo Cuenta</label>
                        <select name="bankAccountType" title="Tipo de cuenta bancaria" defaultValue={data.bankAccountType} className={fieldClass}>
                            <option value="Corriente">Cuenta Corriente</option>
                            <option value="Vista">Cuenta Vista / RUT</option>
                            <option value="Ahorro">Cuenta de Ahorro</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Número</label>
                        <input name="bankAccountNumber" title="Número de cuenta" placeholder="00000000" defaultValue={data.bankAccountNumber} className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Email Confirmación</label>
                        <input type="email" name="bankAccountEmail" title="Email de confirmación de pago" placeholder="pagos@ejemplo.cl" defaultValue={data.bankAccountEmail} className={fieldClass} />
                    </div>
                </div>
            </Section>

            {/* ── Control de Tiempo ── */}
            <Section icon={<Clock className="w-4 h-4" />} title="Control de Tiempo y Hándicap">
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" name="hasHandicap" defaultChecked={data.hasHandicap} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-700 rounded-full peer-checked:bg-amber-500 transition-colors" />
                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
                        </div>
                        <span className="text-sm text-slate-300 font-medium">Torneo con Hándicap</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Control de Tiempo</label>
                            <select name="timeControlMode" title="Modo de control de tiempo"
                                value={data.timeControlMode}
                                onChange={e => set("timeControlMode", e.target.value)}
                                className={fieldClass}>
                                <option value="NONE">Sin Reloj</option>
                                <option value="SHOT_CLOCK">Reloj por Tiro</option>
                                <option value="MATCH_TOTAL">Tiempo Total x Partida</option>
                            </select>
                        </div>
                        {data.timeControlMode === "SHOT_CLOCK" && (
                            <>
                                <div>
                                    <label className={labelClass}>Segundos por tiro</label>
                                    <input type="number" name="secondsPerShot" title="Segundos por tiro"
                                        value={data.secondsPerShot} min={10} max={120}
                                        onChange={e => set("secondsPerShot", parseInt(e.target.value) || 40)}
                                        className={fieldClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Extensiones por jugador</label>
                                    <input type="number" name="extensionsPerPlayer" title="Extensiones por jugador"
                                        value={data.extensionsPerPlayer} min={0} max={10}
                                        onChange={e => set("extensionsPerPlayer", parseInt(e.target.value) || 0)}
                                        className={fieldClass} />
                                </div>
                            </>
                        )}
                        {data.timeControlMode === "MATCH_TOTAL" && (
                            <div>
                                <label className={labelClass}>Segundos por tiro (aviso)</label>
                                <input type="number" name="secondsPerShot" title="Segundos por tiro"
                                    value={data.secondsPerShot} min={10} max={120}
                                    onChange={e => set("secondsPerShot", parseInt(e.target.value) || 40)}
                                    className={fieldClass} />
                            </div>
                        )}
                    </div>
                </div>
            </Section>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4 pt-2">
                <button type="button" onClick={() => router.back()}
                    className="px-6 py-3 text-slate-400 hover:text-white text-sm font-bold transition-colors">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-500/20"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
        </form>
    );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-widest pb-2 border-b border-white/5">
                {icon} {title}
            </div>
            {children}
        </div>
    );
}
