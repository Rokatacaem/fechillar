"use client";

import React, { useState, useRef } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, CreditCard, Shield, Loader2, Save, Camera, Building, UserCircle } from "lucide-react";
import { updatePlayer } from "@/app/(sgf)/players/actions";
import { toast } from "sonner";

interface EditPlayerDialogProps {
    player: {
        id: string;
        name: string;
        email: string;
        rut: string | null;
        clubId: string | null;
        gender: string | null;
        photoUrl: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
    clubs: { id: string; name: string }[];
}

export function EditPlayerDialog({ player, isOpen, onClose, clubs }: EditPlayerDialogProps) {
    const [formData, setFormData] = useState({
        name: player.name,
        email: player.email,
        rut: player.rut || "",
        clubId: player.clubId || "",
        gender: player.gender || "MASCULINO"
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [preview, setPreview] = useState<string | null>(player.photoUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("email", formData.email);
            data.append("rut", formData.rut);
            data.append("clubId", formData.clubId);
            data.append("gender", formData.gender);
            
            if (fileInputRef.current?.files?.[0]) {
                data.append("photo", fileInputRef.current.files[0]);
            }

            const res = await updatePlayer(player.id, data);
            if (res.success) {
                toast.success("Expediente actualizado correctamente");
                onClose();
            } else {
                // Mostrar el error real del servidor
                toast.error(res.error ?? "Error al actualizar el expediente");
            }
        } catch (error: any) {
            toast.error(error.message ?? "Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-[#0a1224] border-white/10 text-white rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="p-8 space-y-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                    <Shield className="w-6 h-6 text-blue-500" />
                                </div>
                                GESTIÓN DE EXPEDIENTE
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* Columna Foto */}
                            <div className="md:col-span-4 space-y-4">
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative aspect-square rounded-[2rem] bg-slate-900 border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-blue-500/40 transition-all"
                                >
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="text-center space-y-2">
                                            <Camera className="w-10 h-10 text-slate-700 mx-auto" />
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Subir Foto</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest leading-tight">
                                    Retrato oficial para<br/>identificación y carnet
                                </p>
                            </div>

                            {/* Columna Datos */}
                            <div className="md:col-span-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 ml-1 font-black">Nombre Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                                        <Input 
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12 focus:ring-1 focus:ring-blue-500/50 transition-all font-bold uppercase text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-slate-500 ml-1 font-black">RUT / Identidad</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                                            <Input 
                                                value={formData.rut}
                                                onChange={(e) => setFormData({...formData, rut: e.target.value})}
                                                placeholder="Ej: 123456789"
                                                className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-slate-500 ml-1 font-black">Género</label>
                                        <div className="relative">
                                            <UserCircle className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                                            <select 
                                                value={formData.gender}
                                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                                className="w-full pl-12 bg-white/5 border-white/10 rounded-2xl h-12 focus:ring-1 focus:ring-blue-500/50 transition-all font-bold uppercase text-xs outline-none appearance-none"
                                            >
                                                <option value="MASCULINO" className="bg-slate-900">MASCULINO</option>
                                                <option value="FEMENINO" className="bg-slate-900">FEMENINO</option>
                                                <option value="OTRO" className="bg-slate-900">OTRO</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-emerald-500 ml-1 font-black">Email Federativo</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-emerald-500/50" />
                                        <Input 
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            type="email"
                                            className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-amber-500 ml-1 font-black italic">Traspaso de Club (Sede)</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-3.5 h-4 w-4 text-amber-500/50" />
                                        <select 
                                            value={formData.clubId}
                                            onChange={(e) => setFormData({...formData, clubId: e.target.value})}
                                            className="w-full pl-12 bg-white/5 border-white/10 rounded-2xl h-12 focus:ring-1 focus:ring-amber-500/50 transition-all font-bold uppercase text-xs outline-none appearance-none"
                                        >
                                            <option value="" className="bg-slate-900">SIN CLUB / INDEPENDIENTE</option>
                                            {clubs.map(c => (
                                                <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-900/50 p-6 flex gap-4 border-t border-white/5">
                        <Button 
                            type="button"
                            variant="ghost" 
                            onClick={onClose}
                            className="text-slate-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest px-8"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit"
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl px-12 h-14 transition-all flex items-center gap-3 uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {isSaving ? "PROCESANDO..." : "ACTUALIZAR EXPEDIENTE"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
