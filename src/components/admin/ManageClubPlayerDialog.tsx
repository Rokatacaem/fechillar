"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    UserPlus, Edit2, Loader2, Save, 
    User, Camera, Building, Mail, 
    Fingerprint, Trash2, Shield,
    UserCircle
} from "lucide-react";
import { upsertPlayerInClub } from "@/app/admin/clubes/actions";
import { deletePlayer } from "@/app/(sgf)/players/actions";
import { toast } from "sonner";
import { Discipline } from "@prisma/client";

interface Props {
    clubId: string;
    player?: any;
    onSuccess?: () => void;
    allClubs?: { id: string; name: string; slug: string }[];
}

export function ManageClubPlayerDialog({ clubId, player, onSuccess, allClubs }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        rut: "",
        gender: "MASCULINO",
        disciplines: [Discipline.THREE_BAND] as Discipline[],
        assignedClubId: clubId
    });

    useEffect(() => {
        if (player) {
            const names = player.user?.name?.split(" ") || ["", ""];
            setFormData({
                firstName: player.firstName || names[0] || "",
                lastName: player.lastName || names.slice(1).join(" ") || "",
                email: player.user?.email || player.email || "",
                rut: player.rut || "",
                gender: player.gender || "MASCULINO",
                disciplines: player.rankings?.map((r: any) => r.discipline) || [Discipline.THREE_BAND],
                assignedClubId: player.tenantId || clubId
            });
            setPreview(player.photoUrl || null);
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                rut: "",
                gender: "MASCULINO",
                disciplines: [Discipline.THREE_BAND],
                assignedClubId: clubId
            });
            setPreview(null);
        }
    }, [player, open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const toggleDiscipline = (disc: Discipline) => {
        setFormData(prev => {
            const current = prev.disciplines;
            const next = current.includes(disc) 
                ? current.filter(d => d !== disc)
                : [...current, disc];
            return next.length > 0 ? { ...prev, disciplines: next } : prev;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            if (player?.id) data.append("id", player.id);
            data.append("firstName", formData.firstName);
            data.append("lastName", formData.lastName);
            data.append("rut", formData.rut);
            data.append("email", formData.email);
            data.append("gender", formData.gender);
            data.append("assignedClubId", formData.assignedClubId);
            data.append("disciplines", JSON.stringify(formData.disciplines));
            
            if (fileInputRef.current?.files?.[0]) {
                data.append("photo", fileInputRef.current.files[0]);
            }

            const result = await upsertPlayerInClub(clubId, data);

            if (result.success) {
                toast.success(player ? "Expediente actualizado" : "Jugador incorporado con éxito");
                setOpen(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || "Ocurrió un error");
            }
        } catch (error) {
            toast.error("Error crítico en la operación");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${formData.firstName} ${formData.lastName}? Esta acción no se puede deshacer.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await deletePlayer(player.id);
            if (res.success) {
                toast.success("Jugador eliminado correctamente");
                setOpen(false);
                if (onSuccess) onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const triggerElement = player ? (
        <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:text-blue-400">
            <Edit2 className="w-3.5 h-3.5" />
        </Button>
    ) : (
        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] px-6 h-9 rounded-xl shadow-lg shadow-emerald-500/10">
            <UserPlus className="w-4 h-4 mr-2" />
            Incorporar Deportista
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={triggerElement} />
            <DialogContent className="bg-[#0a1224] border-white/10 text-white sm:max-w-5xl rounded-3xl p-0 overflow-hidden shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-6 pb-4 border-b border-white/5 bg-slate-950/30">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    {player ? <Edit2 className="w-6 h-6 text-blue-400" /> : <UserPlus className="w-6 h-6 text-emerald-400" />}
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black uppercase tracking-tight italic leading-none">
                                        {player ? "Editar Perfil" : "Nuevo Registro Federado"}
                                    </DialogTitle>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                        <Building className="w-3 h-3" /> SGF · Federación Nacional de Billar
                                    </p>
                                </div>
                            </div>
                            {player && (
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    disabled={isDeleting}
                                    className="text-rose-500 hover:text-rose-400 gap-2 font-black uppercase text-[10px] hover:bg-rose-500/10" 
                                    onClick={handleDelete}
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Eliminar
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="p-8 grid grid-cols-12 gap-10">
                        <div className="col-span-3 space-y-6">
                            <div 
                                onClick={() => fileInputRef.current?.click()} 
                                className="relative aspect-[3/4] rounded-2xl bg-slate-900 border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-blue-500/40 transition-all shadow-2xl"
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-slate-700 group-hover:text-blue-500/50 transition-colors">
                                        <Camera className="w-12 h-12" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center px-4">Retrato Oficial</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Edit2 className="w-8 h-8 text-white" />
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>

                            <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/5 space-y-3 shadow-inner">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block text-center">Disciplinas Activas</label>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => toggleDiscipline(Discipline.THREE_BAND)} 
                                        className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                                            formData.disciplines.includes(Discipline.THREE_BAND) 
                                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                                                : 'bg-slate-900 border-slate-800 text-slate-600'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" /> 3 Bandas
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => toggleDiscipline(Discipline.BUCHACAS)} 
                                        className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                                            formData.disciplines.includes(Discipline.BUCHACAS) 
                                                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                                : 'bg-slate-900 border-slate-800 text-slate-600'
                                        }`}
                                    >
                                        <Shield className="w-3.5 h-3.5" /> Pool / Snooker
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-9 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombres</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-600" />
                                        <Input 
                                            required
                                            className="pl-12 bg-slate-950 border-slate-800 rounded-2xl h-11 text-sm font-bold uppercase focus:border-blue-500/50 transition-all" 
                                            value={formData.firstName} 
                                            onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellidos</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-600" />
                                        <Input 
                                            required
                                            className="pl-12 bg-slate-950 border-slate-800 rounded-2xl h-11 text-sm font-bold uppercase focus:border-blue-500/50 transition-all" 
                                            value={formData.lastName} 
                                            onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">RUT / Identidad</label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-4 top-3.5 h-4 w-4 text-slate-600" />
                                        <Input 
                                            disabled={!!player?.rut} 
                                            className="pl-12 bg-slate-950 border-slate-800 rounded-2xl h-11 text-sm font-mono tracking-wider disabled:opacity-50" 
                                            value={formData.rut} 
                                            onChange={(e) => setFormData({...formData, rut: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Género</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-4 top-3.5 h-4 w-4 text-slate-600" />
                                        <select 
                                            value={formData.gender} 
                                            onChange={(e) => setFormData({...formData, gender: e.target.value})} 
                                            className="w-full pl-12 bg-slate-950 border-slate-800 rounded-2xl h-11 text-[11px] font-black uppercase appearance-none outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                                        >
                                            <option value="MASCULINO">MASCULINO</option>
                                            <option value="FEMENINO">FEMENINO</option>
                                            <option value="OTRO">OTRO</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-blue-500/50" />
                                    <Input 
                                        type="email" 
                                        placeholder="Opcional"
                                        className="pl-12 bg-slate-950 border-slate-800 rounded-2xl h-11 text-sm font-medium tracking-wide focus:border-blue-500/50 transition-all" 
                                        value={formData.email} 
                                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                    />
                                </div>
                            </div>

                            {allClubs && allClubs.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Asignar a Club (Solo Admin)</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-3.5 h-4 w-4 text-amber-500/50" />
                                        <select 
                                            value={formData.assignedClubId} 
                                            onChange={(e) => setFormData({...formData, assignedClubId: e.target.value})} 
                                            className="w-full pl-12 bg-slate-950 border-amber-500/20 rounded-2xl h-11 text-[11px] font-black uppercase appearance-none outline-none focus:border-amber-500 transition-all cursor-pointer text-amber-500"
                                        >
                                            {allClubs.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[9px] text-slate-500 italic px-2">Puedes transferir a este deportista a cualquier otro club.</p>
                                </div>
                            )}

                            {/* Ranking Stats (Read Only) */}
                            {player?.rankings && player.rankings.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Métricas de Ranking Actual</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {player.rankings.map((r: any) => (
                                            <div key={r.discipline} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">{r.discipline.replace('_', ' ')}</span>
                                                    <span className="text-xs font-black text-amber-400 uppercase">{r.category}</span>
                                                </div>
                                                <div className="flex items-center gap-6 text-right">
                                                    <div>
                                                        <span className="text-[8px] font-mono text-slate-500 block">PUNTOS</span>
                                                        <span className="text-sm font-black text-white">{r.points}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-mono text-slate-500 block">PROMEDIO</span>
                                                        <span className="text-sm font-bold text-slate-300">{r.average ? r.average.toFixed(3) : "0.000"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-mono text-slate-500 block">HANDICAP</span>
                                                        <span className="text-sm font-black text-emerald-400">{r.handicapTarget || 15}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                                <Shield className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Protección de Datos SGF</p>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
                                        Toda modificación quedará registrada. La foto será visible en el <span className="text-blue-300 font-bold underline underline-offset-4">Carnet Oficial</span> de la Federación.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-6 bg-slate-950 border-t border-white/5 flex justify-between items-center">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            className="text-slate-500 font-black uppercase text-[10px] hover:text-white" 
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="bg-blue-600 hover:bg-blue-500 text-white px-12 h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-600/20 flex items-center gap-3 active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {player ? "Guardar Cambios" : "Emitir Registro"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
