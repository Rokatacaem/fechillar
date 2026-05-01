"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Save, Loader2, Calendar as CalendarIcon, FileText, Upload, Clock, Image as ImageIcon } from "lucide-react";
import { updateClubFederativeDetails, uploadClubCertificate, grantClubExtension, uploadClubLogo } from "@/app/admin/clubes/actions";
import { toast } from "sonner";
import { ClubMembershipStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useRef } from "react";

import { parseLegalStatus } from "@/lib/utils";

interface Props {
    club: {
        id: string;
        name: string;
        address?: string | null;
        city?: string | null;
        logoUrl?: string | null;
        foundedDate?: Date | null;
        membershipStatus: ClubMembershipStatus;
        certificateUrl?: string | null;
        legalStatus?: string | null;
    };
}

export function EditClubDetailsDialog({ club }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [name, setName] = useState(club.name || "");
    const [address, setAddress] = useState(club.address || "");
    const [city, setCity] = useState(club.city || "");
    const [foundedDate, setFoundedDate] = useState(
        club.foundedDate ? new Date(club.foundedDate).toISOString().split('T')[0] : ""
    );
    const [membershipStatus, setMembershipStatus] = useState<ClubMembershipStatus>(club.membershipStatus);
    
    // Estados de cumplimiento (Parsing legalStatus JSON)
    const initialCompliance = parseLegalStatus(club.legalStatus || null);

    const [certificateUrl, setCertificateUrl] = useState(club.certificateUrl || "");
    const [logoUrl, setLogoUrl] = useState(club.logoUrl || "");
    const [expiryDate, setExpiryDate] = useState(initialCompliance.expiryDate);
    const [deferredUntil, setDeferredUntil] = useState(initialCompliance.deferredUntil);
    const [complianceNotes, setComplianceNotes] = useState(initialCompliance.notes);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            return toast.error("Solo se admiten archivos PDF");
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clubId", club.id);

        try {
            const result = await uploadClubCertificate(formData);
            if (result.success) {
                toast.success(`Certificado y Directiva sincronizados (${result.boardCount} miembros)`);
                setCertificateUrl(result.url || "");
                router.refresh(); // Forzar actualización de Server Components
            } else {
                toast.error(result.error || "Error al subir");
            }
        } catch (error) {
            toast.error("Error técnico en la subida");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Guardar detalles básicos
            const basicResult = await updateClubFederativeDetails(club.id, {
                name: name || undefined,
                address: address || undefined,
                city: city || undefined,
                foundedDate: foundedDate || undefined,
                membershipStatus,
                certificateUrl: certificateUrl || undefined,
                legalStatus: expiryDate // Guardamos la fecha base
            });

            // 2. Si hay datos de prórroga, aplicar acción específica
            if (deferredUntil || complianceNotes) {
                await grantClubExtension(club.id, {
                    until: deferredUntil,
                    notes: complianceNotes
                });
            }

            if (basicResult.success) {
                toast.success("Parámetros actualizados");
                setOpen(false);
            } else {
                toast.error(basicResult.error);
            }
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                render={
                    <Button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700 shadow-lg">
                        Editar Parámetros Técnicos
                    </Button>
                }
            >
                Editar Parámetros Técnicos
            </DialogTrigger>
            <DialogContent className="bg-[#0c1220] border-slate-800 text-white max-w-md rounded-[32px] p-8 shadow-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 italic">
                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                        Estatus Federativo
                    </DialogTitle>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">
                        Configuración maestra de la sede
                    </p>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Nombre del Club</label>
                        <input 
                            type="text"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Club de Billar Santiago"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Ciudad</label>
                            <input 
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ej: Santiago"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Fecha de Fundación</label>
                            <div className="relative">
                                <input 
                                    type="date"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={foundedDate}
                                    onChange={(e) => setFoundedDate(e.target.value)}
                                />
                                <CalendarIcon className="absolute right-4 top-3 w-4 h-4 text-slate-600 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Dirección Oficial</label>
                        <input 
                            type="text"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Ej: Av. Libertador Bernardo O'Higgins 2820"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Estado de Membresía</label>
                        <select 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                            value={membershipStatus}
                            onChange={(e) => setMembershipStatus(e.target.value as ClubMembershipStatus)}
                        >
                            <option value="VIGENTE">VIGENTE</option>
                            <option value="MOROSO">MOROSO</option>
                            <option value="RETIRADO">RETIRADO</option>
                            <option value="SUSPENDIDO">SUSPENDIDO</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Fecha de vigencia oficial</label>
                        <input 
                            type="date"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                            style={{ colorScheme: 'dark' }}
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                        />
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            Gestión de Prórrogas (Admin)
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Plazo Aplazamiento</label>
                                <input 
                                    type="date"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-amber-200 outline-none focus:ring-1 focus:ring-amber-500/50"
                                    style={{ colorScheme: 'dark' }}
                                    value={deferredUntil}
                                    onChange={(e) => setDeferredUntil(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Motivo / Notas</label>
                                <textarea 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 outline-none focus:ring-1 focus:ring-amber-500/50 min-h-[40px]"
                                    value={complianceNotes}
                                    onChange={(e) => setComplianceNotes(e.target.value)}
                                    placeholder="Ej: En trámite municipal..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Logotipo Institucional (Branding)</label>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                            <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon className="w-6 h-6 text-slate-700" />
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Recomendado: PNG Transparente</p>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden" 
                                    id="logo-upload"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append("file", file);
                                            formData.append("clubId", club.id);
                                            const res = await uploadClubLogo(formData);
                                            if (res.success) {
                                                setLogoUrl(res.url!);
                                                toast.success("Logotipo actualizado");
                                            }
                                        }
                                    }}
                                />
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    className="h-8 border-slate-800 bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-300"
                                >
                                    {logoUrl ? "Cambiar Imagen" : "Subir Logotipo"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Certificado de Vigencia (PDF)</label>
                        <div className="relative group">
                            <input 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 pr-24"
                                value={certificateUrl}
                                onChange={(e) => setCertificateUrl(e.target.value)}
                                placeholder="https://... o sube un archivo"
                            />
                            <div className="absolute right-2 top-1.5 flex gap-1">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-9 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-all"
                                >
                                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Button 
                        disabled={loading}
                        onClick={handleSave}
                        className="w-full py-7 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 mt-4"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <Save className="w-5 h-5 mr-3" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
