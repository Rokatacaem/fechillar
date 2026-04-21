"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, Trophy, Calendar, MapPin, Users, Settings, Clock, Hash } from "lucide-react";
import { updateTournament } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InitialData {
    name: string;
    description: string;
    location: string;
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
    groupSize: number;
    advancingCount: number;
    inningsPerPhase: number;
    playerCount: number;
    hasHandicap: boolean;
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Información General ── */}
            <Section icon={<Trophy className="w-4 h-4" />} title="Información General">
                <div className="space-y-4">
                    <div>
                        <label className={labelClass}>Nombre del torneo</label>
                        <input name="name" defaultValue={data.name} required className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Descripción</label>
                        <textarea name="description" defaultValue={data.description} rows={2}
                            className={fieldClass + " resize-none"} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Disciplina</label>
                            <input value={data.discipline} disabled
                                className={fieldClass + " opacity-40 cursor-not-allowed"} />
                            <p className="text-[9px] text-slate-600 mt-1">La disciplina no puede cambiarse después de crear el torneo.</p>
                        </div>
                        <div>
                            <label className={labelClass}>Categoría</label>
                            <input value={data.category} disabled
                                className={fieldClass + " opacity-40 cursor-not-allowed"} />
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Fechas y Sede ── */}
            <Section icon={<Calendar className="w-4 h-4" />} title="Fechas y Sede">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Fecha de inicio</label>
                        <input type="date" name="startDate" defaultValue={data.startDate} required className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Fecha de término</label>
                        <input type="date" name="endDate" defaultValue={data.endDate} className={fieldClass} />
                    </div>
                </div>
                <div className="mt-4">
                    <label className={labelClass}>Ubicación / Dirección</label>
                    <input name="location" defaultValue={data.location} className={fieldClass} placeholder="Ej: Av. Colón 1234, Valparaíso" />
                </div>
                <div className="mt-4">
                    <label className={labelClass}>Club sede</label>
                    <select name="tenantId" defaultValue={data.tenantId} className={fieldClass}>
                        <option value="">— Federación (sin club sede) —</option>
                        {clubs.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </Section>

            {/* ── Estado y Alcance ── */}
            <Section icon={<Settings className="w-4 h-4" />} title="Estado y Alcance">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Estado</label>
                        <select name="status" defaultValue={data.status} className={fieldClass}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Alcance</label>
                        <select name="scope" defaultValue={data.scope} className={fieldClass}>
                            {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </Section>

            {/* ── Infraestructura ── */}
            <Section icon={<MapPin className="w-4 h-4" />} title="Infraestructura">
                <div>
                    <label className={labelClass}>Mesas disponibles</label>
                    <input type="number" name="maxTables" defaultValue={data.maxTables} min={1} max={30} className={fieldClass} />
                </div>
            </Section>

            {/* ── Configuración de Grupos ── */}
            <Section icon={<Users className="w-4 h-4" />} title="Configuración de Grupos">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Jugadores por grupo</label>
                        <input type="number" name="groupSize" defaultValue={data.groupSize} min={2} max={8} className={fieldClass} />
                        <p className="text-[9px] text-slate-600 mt-1">
                            {data.groupSize > 0
                                ? `${Math.ceil(data.playerCount / data.groupSize)} grupos con ${data.playerCount} jugadores`
                                : ""}
                        </p>
                    </div>
                    <div>
                        <label className={labelClass}>Avanzan por grupo</label>
                        <input type="number" name="advancingCount" defaultValue={data.advancingCount} min={1} max={6} className={fieldClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Total jugadores</label>
                        <input type="number" name="playerCount" defaultValue={data.playerCount} min={2} max={256} className={fieldClass} />
                    </div>
                </div>
                <div className="mt-4">
                    <label className={labelClass}>Entradas por fase</label>
                    <input type="number" name="inningsPerPhase" defaultValue={data.inningsPerPhase} min={1} max={200} className={fieldClass} />
                </div>
            </Section>

            {/* ── Control de Tiempo ── */}
            <Section icon={<Clock className="w-4 h-4" />} title="Control de Tiempo y Hándicap">
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" name="hasHandicap" defaultChecked={data.hasHandicap}
                                className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-700 rounded-full peer-checked:bg-amber-500 transition-colors" />
                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
                        </div>
                        <span className="text-sm text-slate-300 font-medium">
                            Torneo con Hándicap
                        </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" name="hasTimeLimit" defaultChecked={data.hasTimeLimit}
                                className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-700 rounded-full peer-checked:bg-amber-500 transition-colors" />
                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
                        </div>
                        <span className="text-sm text-slate-300 font-medium">
                            Límite de tiempo por tiro
                        </span>
                    </label>
                    <div>
                        <label className={labelClass}>Segundos por tiro</label>
                        <input type="number" name="secondsPerShot" defaultValue={data.secondsPerShot} min={10} max={120} className={fieldClass} />
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
