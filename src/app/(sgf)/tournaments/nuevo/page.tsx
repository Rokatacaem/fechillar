import React from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { auth } from "@/auth";
import { createTournament } from "./actions";
import { redirect } from "next/navigation";

export default async function NewTournamentPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const role = (session.user as any).role || "USER";
    const canCreateNational = ["FEDERATION_DELEGATE", "FEDERATION_ADMIN", "SUPERADMIN"].includes(role);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
            {/* Header / Nav */}
            <div className="flex flex-col gap-4">
                <Link href="/tournaments" className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-xl w-fit">
                    <ArrowLeft className="w-4 h-4" />
                    Listado de Torneos
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                        CREAR <span className="text-emerald-500">TORNEO</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
                        Define los parámetros de la nueva competencia
                    </p>
                </div>
            </div>

            {/* Formulario de Torneo */}
            <form action={createTournament} className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md shadow-2xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre del Torneo */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre de la Competencia</label>
                        <input 
                          name="name" 
                          placeholder="Ej. Campeonato Nacional Apertura 2026" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-bold" 
                          required 
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descripción (Opcional)</label>
                        <textarea 
                          name="description" 
                          rows={3}
                          placeholder="Información relevante, reglas especiales o detalles del evento..." 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none" 
                        />
                    </div>

                    {/* Disciplina */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Disciplina Base</label>
                        <select 
                          name="discipline" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                          required
                        >
                            <option value="CARAMBOLA" className="bg-slate-950">Carambola (Three-Cushion)</option>
                            <option value="POOL" className="bg-slate-950">Pool (Buchaca)</option>
                            <option value="SNOOKER" className="bg-slate-950">Snooker</option>
                        </select>
                    </div>

                    {/* Modalidad */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modalidad Base</label>
                        <select 
                          name="modality" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                          required
                        >
                            <option value="THREE_BAND" className="bg-slate-950">Tres Bandas</option>
                            <option value="FREE" className="bg-slate-950">Libre</option>
                            <option value="EIGHT_BALL" className="bg-slate-950">Bola 8</option>
                            <option value="NINE_BALL" className="bg-slate-950">Bola 9</option>
                            <option value="TEN_BALL" className="bg-slate-950">Bola 10</option>
                        </select>
                    </div>

                    {/* Categoría */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoría Inicial</label>
                        <select 
                          name="category" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                          required
                        >
                            <option value="HONOR" className="bg-slate-950">Honor (Pro)</option>
                            <option value="FIRST" className="bg-slate-950">Primera Categoría</option>
                            <option value="SECOND" className="bg-slate-950">Segunda Categoría</option>
                            <option value="THIRD" className="bg-slate-950">Tercera Categoría</option>
                            <option value="SENIOR" className="bg-slate-950">Senior (+55)</option>
                            <option value="FEMALE" className="bg-slate-950">Femenina</option>
                        </select>
                    </div>

                    {/* Estado */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado de Publicación</label>
                        <select 
                          name="status" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                          required
                        >
                            <option value="DRAFT" className="bg-slate-950 text-slate-500">DRAFT (Borrador Interno)</option>
                            <option value="OPEN" className="bg-slate-950 text-emerald-500">OPEN (Inscripciones Abiertas)</option>
                            <option value="UPCOMING" className="bg-slate-950 text-yellow-500">UPCOMING (Anunciado)</option>
                        </select>
                    </div>

                    {/* Scope de Competencia */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                            Alcance del Torneo
                            {!canCreateNational && (
                                <span className="text-[9px] text-emerald-500">Solo Interno</span>
                            )}
                        </label>
                        <select 
                          name="scope" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50" 
                          required
                        >
                            <option value="INTERNAL" className="bg-slate-950 text-emerald-400">INTERNAL (Torneo de Club)</option>
                            {canCreateNational && (
                                <option value="NATIONAL" className="bg-slate-950 text-blue-400">NATIONAL (Torneo Federado)</option>
                            )}
                        </select>
                    </div>

                    {/* Fechas */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fecha de Inicio</label>
                        <input 
                          type="date"
                          name="startDate" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono" 
                          required 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fecha de Finalización</label>
                        <input 
                          type="date"
                          name="endDate" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono" 
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                    <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-10 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-xl shadow-emerald-500/10 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        CREAR COMPETENCIA
                    </button>
                </div>
            </form>
        </div>
    );
}
