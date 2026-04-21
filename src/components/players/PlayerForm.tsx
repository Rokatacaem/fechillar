"use client";

import React, { useState } from "react";
import { createPlayer } from "@/app/(sgf)/players/nuevo/actions";
import { Camera, Save, User, Award, Building, Mail, Fingerprint } from "lucide-react";
import { Category } from "@prisma/client";

interface PlayerFormProps {
    clubs: { id: string; name: string }[];
}

export function PlayerForm({ clubs }: PlayerFormProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const categories = [
        { id: Category.MASTER, label: "Maestro" },
        { id: Category.HONOR, label: "Honor" },
        { id: Category.FIRST, label: "Primera" },
        { id: Category.SECOND, label: "Segunda" },
        { id: Category.THIRD, label: "Tercera" },
        { id: Category.FOURTH, label: "Cuarta" },
        { id: Category.FIFTH_A, label: "Quinta A" },
        { id: Category.FIFTH_B, label: "Quinta B" },
        { id: Category.SENIOR, label: "Senior" },
        { id: Category.FEMALE, label: "Dama" },
    ];

    return (
        <form
            action={async (formData) => {
                setIsPending(true);
                try {
                    await createPlayer(formData);
                } catch (error: any) {
                    // Si es un error de Next.js Redirect, lo dejamos pasar para que el navegador navegue
                    if (error.message === "NEXT_REDIRECT") throw error;
                    
                    console.error("Error en el registro:", error);
                    alert(error.message || "No se pudo registrar al jugador.");
                    setIsPending(false);
                }
            }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
            <div className="lg:col-span-4 space-y-6">
                <div className="relative group aspect-square rounded-[2rem] bg-slate-900 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-500/40 shadow-2xl">
                    {preview ? (
                        <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-700">
                            <Camera className="w-12 h-12" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retrato Oficial</span>
                        </div>
                    )}
                    <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    />
                </div>

                <div className="p-6 rounded-[2rem] bg-slate-900/50 border border-white/5 space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        Categoría Inicial
                    </label>
                    <select 
                        name="category" 
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm font-bold uppercase tracking-tighter"
                    >
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id} className="bg-slate-950">
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-blue-500" />
                                Nombres
                            </label>
                            <input 
                                name="firstName" 
                                placeholder="Ejem: Juan Carlos"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-bold uppercase text-sm" 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-blue-500" />
                                Apellidos
                            </label>
                            <input 
                                name="lastName" 
                                placeholder="Ejem: Pérez González"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-bold uppercase text-sm" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Fingerprint className="w-3.5 h-3.5 text-emerald-500" />
                                RUT (SIN PUNTOS NI GUION)
                            </label>
                            <input 
                                name="rut" 
                                placeholder="123456789" 
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-sm" 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 text-emerald-500" />
                                Club de Destino
                            </label>
                            <select 
                                name="clubId" 
                                required
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm font-bold uppercase tracking-tighter"
                            >
                                <option value="" className="text-slate-500">SELECCIONAR SEDE...</option>
                                {clubs.map((club) => (
                                    <option key={club.id} value={club.id} className="bg-slate-950">
                                        {club.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 pt-6 border-t border-white/5">
                        <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" />
                            Correo Electrónico Oficial
                        </label>
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="jugador@ejemplo.com" 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-sm" 
                            required 
                        />
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 px-12 py-5 rounded-3xl font-black transition-all flex items-center gap-4 shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)] active:scale-95"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                    REGISTRANDO...
                                </>
                            ) : (
                                <>
                                    <Save className="w-6 h-6 transition-transform group-hover:scale-110" />
                                    INCORPORAR AL PADRÓN NACIONAL
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}