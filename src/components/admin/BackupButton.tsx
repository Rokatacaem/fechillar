"use client";

import React, { useState } from "react";
import { Database, ShieldCheck, Loader2 } from "lucide-react";
import { createSystemBackup } from "@/app/admin/dashboard/actions";
import { toast } from "sonner";

export function BackupButton() {
    const [isPending, setIsPending] = useState(false);

    const handleBackup = async () => {
        setIsPending(true);
        try {
            const result = await createSystemBackup();
            if (result.success) {
                toast.success("Respaldo Generado", {
                    description: `Archivo: ${result.fileName} guardado en /backups`,
                    icon: <ShieldCheck className="text-emerald-500 w-5 h-5" />
                });
            }
        } catch (error: any) {
            toast.error("Error de Respaldo", {
                description: error.message
            });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleBackup}
            disabled={isPending}
            className="flex items-center gap-3 bg-slate-950 border border-slate-800 text-slate-300 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-[0.1em] hover:border-emerald-500 hover:text-emerald-400 transition-all active:scale-95 disabled:opacity-50 group"
        >
            {isPending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    Generando Punto de Restauración...
                </>
            ) : (
                <>
                    <Database className="w-4 h-4 group-hover:text-emerald-500 transition-colors" />
                    Generar Respaldo SGF
                </>
            )}
        </button>
    );
}
