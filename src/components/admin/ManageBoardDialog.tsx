"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Users, Save, Loader2, UserPlus, ShieldCheck, ShieldAlert, CheckCircle2 } from "lucide-react";
import { addBoardMember, deleteBoardMember, validateBoardMember } from "@/app/admin/clubes/actions";
import { toast } from "sonner";
import { ClubBoardRole } from "@prisma/client";

interface Props {
    clubId: string;
    existingMembers?: any[];
}

export function ManageBoardDialog({ clubId, existingMembers = [] }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [name, setName] = useState("");
    const [role, setRole] = useState<ClubBoardRole>("PRESIDENTE");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const handleAdd = async () => {
        if (!name) return toast.error("El nombre es obligatorio");
        setLoading(true);
        try {
            const result = await addBoardMember(clubId, { name, role, email, phone });
            if (result.success) {
                toast.success("Miembro añadido");
                setName("");
                setEmail("");
                setPhone("");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al añadir");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este dirigente?")) return;
        try {
            const result = await deleteBoardMember(id, clubId);
            if (result.success) {
                toast.success("Miembro eliminado");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const handleValidate = async (id: string) => {
        try {
            const result = await validateBoardMember(id, clubId);
            if (result.success) {
                toast.success("Autoridad validada oficialmente");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al validar");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                render={
                    <Button className="h-8 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors focus:outline-none">
                        Gestionar Directiva
                    </Button>
                }
            />
            <DialogContent className="bg-[#0c1220] border-slate-800 text-white max-w-xl rounded-[32px] p-8 shadow-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 italic">
                        <Users className="w-6 h-6 text-blue-500" />
                        Directiva Oficial
                    </DialogTitle>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">
                        Autoridades con vigencia legal ante la federación
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Formulario de Alta */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                            <UserPlus className="w-3 h-3" />
                            Nueva Autoridad
                        </h3>
                        
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Cargo</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as ClubBoardRole)}
                                >
                                    <option value="PRESIDENTE">PRESIDENTE</option>
                                    <option value="VICEPRESIDENTE">VICEPRESIDENTE</option>
                                    <option value="SECRETARIO">SECRETARIO</option>
                                    <option value="TESORERO">TESORERO</option>
                                    <option value="DIRECTOR">DIRECTOR</option>
                                    <option value="DELEGADO_DEPORTIVO">DELEGADO DEPORTIVO</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Email / Contacto</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@ejemplo.com"
                                />
                            </div>

                            <Button 
                                disabled={loading}
                                onClick={handleAdd}
                                className="w-full py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest transition-all active:scale-95 text-[10px]"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vincular Autoridad"}
                            </Button>
                        </div>
                    </div>

                    {/* Lista Actual */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Directiva Actual</h3>
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                            {existingMembers.length > 0 ? (
                                <div className="divide-y divide-slate-800">
                                    {existingMembers.map((member) => (
                                        <div key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-900/40 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${member.isValidated ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {member.isValidated ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[11px] font-bold text-slate-200">{member.name}</p>
                                                        {!member.isValidated && (
                                                            <span className="text-[7px] font-black bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">Pendiente</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{member.role.replace(/_/g, ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!member.isValidated && (
                                                    <button 
                                                        onClick={() => handleValidate(member.id)}
                                                        className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                        title="Validar oficialmente"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(member.id)}
                                                    className="p-1.5 text-slate-600 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest italic">Sin miembros</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
