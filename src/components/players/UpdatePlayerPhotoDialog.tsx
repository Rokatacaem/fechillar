"use client";

import React, { useState, useRef } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Check, Loader2, X } from "lucide-react";
import { updatePlayerPhoto } from "@/app/(sgf)/players/actions";

interface UpdatePlayerPhotoDialogProps {
    playerId: string;
    playerName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function UpdatePlayerPhotoDialog({ playerId, playerName, isOpen, onClose }: UpdatePlayerPhotoDialogProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!fileInputRef.current?.files?.[0]) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("photo", fileInputRef.current.files[0]);

        try {
            const res = await updatePlayerPhoto(playerId, formData);
            if (res.success) {
                onClose();
                // Forzar refresco ligero o notificación de éxito si fuera necesario
            }
        } catch (error: any) {
            alert(error.message || "Error al subir la imagen");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-[#0a1224] border-white/10 text-white rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold uppercase tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Camera className="w-5 h-5 text-emerald-500" />
                        </div>
                        Retrato Oficial
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">
                        Sube la fotografía de <span className="text-white font-bold">{playerName}</span>. 
                        Este retrato se utilizará en el carnet digital y tableros de torneo.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative group">
                        <div className="w-48 h-48 rounded-full border-4 border-dashed border-white/10 bg-slate-900/50 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/40 relative">
                            {preview ? (
                                <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center space-y-2 opacity-40">
                                    <Upload className="w-10 h-10 mx-auto" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Seleccionar Archivo</p>
                                </div>
                            )}
                            
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                        </div>
                        
                        {preview && (
                             <button 
                                onClick={() => setPreview(null)}
                                className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors z-20"
                             >
                                <X className="w-3 h-3" />
                             </button>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleUpload}
                        disabled={!preview || isUploading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl px-8 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        {isUploading ? "Subiendo..." : "Confirmar Retrato"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
