"use client";

import { useState } from "react";
import { updateUserRole } from "./actions";

export default function IdentityTribunalPanel({ users, clubs }: { users: any[], clubs: any[] }) {
    const [selectedUser, setSelectedUser] = useState("");
    const [newRole, setNewRole] = useState("USER");
    const [selectedClub, setSelectedClub] = useState("");
    const [reason, setReason] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const isLocalAuthority = ["CLUB_DELEGATE", "CLUB_ADMIN"].includes(newRole);

    const handlePromote = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isLocalAuthority && !selectedClub) {
            alert("Error: Debe asignar una Sede (Club) para este rango de autoridad.");
            return;
        }

        setIsSaving(true);
        try {
            await updateUserRole(selectedUser, newRole as any, reason, selectedClub || undefined);
            alert("Rúbrica disciplinaria ejecutada con éxito.");
            setSelectedUser(""); setReason(""); setSelectedClub("");
        } catch (error: any) {
            alert(error.message || "Error al procesar la identidad.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handlePromote} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Acusado / Candidato</label>
                <select 
                    value={selectedUser} 
                    onChange={e => setSelectedUser(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="" disabled>Seleccione un usuario...</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name || 'Sin Nombre'} ({u.email}) - Actual: {u.role}</option>
                    ))}
                </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Veredicto (Nuevo Rol)</label>
                    <select 
                        value={newRole} 
                        onChange={e => {
                            setNewRole(e.target.value);
                            if (!["CLUB_DELEGATE", "CLUB_ADMIN"].includes(e.target.value)) {
                                setSelectedClub("");
                            }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2"
                    >
                        <option value="USER">Remover Permisos (USER)</option>
                        <option value="CLUB_DELEGATE">Promover a Delegado de Sede</option>
                        <option value="CLUB_ADMIN">Promover a Presidente Club</option>
                        <option value="REFEREE">Promover a Árbitro (REFEREE)</option>
                        <option value="FEDERATION_ADMIN">Promover a Admin Federación</option>
                    </select>
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Causa Penal / Mérito</label>
                     <input 
                        type="text" 
                        required 
                        value={reason} 
                        onChange={e => setReason(e.target.value)} 
                        placeholder="Motivo de la auditoría..." 
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2"
                     />
                </div>
            </div>

            {isLocalAuthority && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                         Jurisdicción Territorial (Sede)
                         <span className="text-[10px] bg-amber-950 text-amber-500 px-1 rounded border border-amber-900">REQUERIDO</span>
                    </label>
                    <select 
                        value={selectedClub} 
                        onChange={e => setSelectedClub(e.target.value)}
                        required={isLocalAuthority}
                        className="w-full bg-slate-950 border border-amber-900/50 text-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                    >
                        <option value="" disabled>Seleccione sede de mando...</option>
                        {clubs.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                        El usuario tendrá control total sobre los registros de esta sede.
                    </p>
                </div>
            )}

            <button disabled={isSaving} className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 border border-slate-600 text-white font-bold py-2 rounded-lg transition-colors shadow">
                {isSaving ? "Fijando Rúbrica de Estado..." : "Ejecutar Trámite Disciplinario"}
            </button>
        </form>
    );
}

