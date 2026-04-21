"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, Mail, Loader2, Key } from "lucide-react";
import { claimPlayerProfile } from "@/app/admin/clubes/bulk-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function ClaimPlayerDialog({ playerId, playerName }: { playerId: string, playerName: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [creds, setCreds] = useState<{ email: string, pass: string } | null>(null);

    const handleClaim = async () => {
        if (!email) return toast.error("El correo es obligatorio");
        setLoading(true);
        try {
            const result = await claimPlayerProfile(playerId, email);
            if (result.success) {
                toast.success("Perfil vinculado con éxito");
                // Extraer clave del mensaje mock si es necesario, o simplemente mostrar éxito
                const passMatch = result.message?.match(/clave provisoria: (\w+)/);
                if (passMatch) {
                    setCreds({ email, pass: passMatch[1] });
                }
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al procesar la vinculación");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                render={
                    <Button variant="ghost" size="sm" className="h-7 px-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/20 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all animate-pulse hover:animate-none">
                        <UserCheck className="w-3 h-3 mr-1.5" />
                        Activar Cuenta
                    </Button>
                }
            />
            <DialogContent className="bg-[#0c1220] border-slate-800 text-white max-w-sm rounded-[32px] p-8 shadow-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3 italic">
                        <Mail className="w-5 h-5 text-amber-500" />
                        Activar Deportista
                    </DialogTitle>
                    <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1 uppercase">Vinculación de perfil digital para {playerName}</p>
                </DialogHeader>

                {creds ? (
                    <div className="space-y-4 bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Key className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h4 className="text-sm font-black text-emerald-400 uppercase">¡Cuenta Activada!</h4>
                        <div className="space-y-2 py-4">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Credenciales Generadas:</p>
                            <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                                <p className="text-xs font-mono text-white">{creds.email}</p>
                                <p className="text-lg font-black text-emerald-400 mt-1 select-all">{creds.pass}</p>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-500 italic">Escribe estos datos y entrégalos al deportista. El sistema registró la vinculación.</p>
                        <Button onClick={() => setOpen(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs rounded-xl mt-4">Listo</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Correo del Deportista</label>
                            <Input 
                                placeholder="jugador@ejemplo.com"
                                className="bg-slate-950 border-slate-800 rounded-xl text-xs font-bold"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <p className="text-[9px] text-slate-500 leading-relaxed italic">
                            Al confirmar, se creará un acceso oficial y se enviará (o generará) una clave provisoria para el primer ingreso.
                        </p>
                        <Button 
                            disabled={loading}
                            onClick={handleClaim}
                            className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 mt-4 transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Vincular y Activar"}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
