"use client";

import React, { useState, useEffect } from "react";
import { createPlayer } from "@/app/(sgf)/players/nuevo/actions";
import { Camera, Save } from "lucide-react";

interface PlayerFormProps {
    clubs: { id: string; name: string }[];
}

export function PlayerForm({ clubs }: PlayerFormProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    // DEPURACIÓN: Asegurar que JS esté cargado
    useEffect(() => {
        console.log("🧩 PLAYER_FORM: JavaScript operativo.");
    }, []);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        console.log("📸 ARCHIVO SELECCIONADO:", file?.name || "Ninguno");
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <form
            action={async (formData) => {
                console.log("SUBMIT DISPARADO - Iniciando transacción de registro...");
                setIsPending(true);
                try {
                    await createPlayer(formData);
                    // El redirect de la acción nos sacará de la página si tiene éxito
                } catch (error) {
                    console.error("Error en el registro:", error);
                    alert("No se pudo registrar al jugador. Revisa si el RUT o Email ya existen.");
                    setIsPending(false);
                }
            }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6"
        >
            {/* SECCIÓN FOTO - Sincronizada con name="photo" */}
            <div className="lg:col-span-1 space-y-4">
                <div className="relative group aspect-[4/5] rounded-3xl bg-slate-900 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-500/40 shadow-2xl">
                    {preview ? (
                        <img src={preview} alt="Vista previa" className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-600 pointer-events-none">
                            <Camera className="w-8 h-8" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Foto Oficial</span>
                        </div>
                    )}
                    <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                        required
                    />
                </div>
                <p className="text-[10px] text-slate-500 text-center font-medium italic">Formatos: JPG o PNG. Máximo 4MB.</p>
            </div>

            {/* SECCIÓN DATOS - Sincronizado con nombres, apellidos, rut, email, tenantId */}
            <div className="lg:col-span-2 space-y-6 bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* RUT */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RUT (ID Nacional)</label>
                        <input 
                          name="rut" 
                          placeholder="12.345.678-9" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono" 
                          required 
                        />
                    </div>

                    {/* Club */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Club Afiliado</label>
                        <select 
                          name="tenantId" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500/50" 
                          required
                        >
                            <option value="" className="bg-slate-950 text-slate-500">Seleccionar Club...</option>
                            {clubs.map((club) => (
                                <option key={club.id} value={club.id} className="bg-slate-950">
                                  {club.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Nombres */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombres</label>
                        <input 
                          name="firstName" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" 
                          required 
                        />
                    </div>

                    {/* Apellidos */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Apellidos</label>
                        <input 
                          name="lastName" 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" 
                          required 
                        />
                    </div>
                </div>

                {/* Email (Clave para creación de User) */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Correo Electrónico para acceso</label>
                    <input 
                      name="email" 
                      type="email" 
                      placeholder="jugador@ejemplo.com" 
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all" 
                      required 
                    />
                </div>

                {/* Botón Submit con Estado isPending */}
                <div className="pt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 px-10 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-xl shadow-emerald-500/10 active:scale-95"
                    >
                        {isPending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                PROCESANDO...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                REGISTRAR JUGADOR
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}