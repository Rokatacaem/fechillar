"use client";

import { useState } from "react";
import { executeEnvironmentPurge } from "@/actions/purge-actions";
import { toast } from "sonner";
import { Flame, Loader2 } from "lucide-react";

export function PurificationTrigger() {
    const [isPurging, setIsPurging] = useState(false);

    const handlePurge = async () => {
        console.log("🛠️ PurificationTrigger: Clic detectado.");
        if (!confirm("⚠️ ATENCIÓN: Esta acción eliminará permanentemente TODOS los clubes, jugadores, torneos y logs (excepto tu cuenta). ¿Estás absolutamente seguro?")) {
            console.log("🛠️ PurificationTrigger: Acción cancelada por el usuario.");
            return;
        }

        setIsPurging(true);
        console.log("🔥 PurificationTrigger: Iniciando llamado a executeEnvironmentPurge...");
        
        try {
            const result = await executeEnvironmentPurge();
            console.log("✅ PurificationTrigger: Resultado recibido:", result);
            
            if (result.success) {
                toast.success("Purificación Completada", {
                    description: result.message || "El entorno ha sido purificado. Redirigiendo...",
                    duration: 5000,
                });
                // Pequeño delay para que el usuario vea el toast antes de recargar
                setTimeout(() => {
                    window.location.href = "/admin/dashboard";
                }, 2000);
            } else {
                toast.error("Fallo de Purificación", { description: result.error });
            }
        } catch (err: any) {
            console.error("❌ PurificationTrigger: Error crítico:", err);
            toast.error("Error de Red", { description: err.message });
        } finally {
            setIsPurging(false);
        }
    };

    return (
        <button
            onClick={handlePurge}
            disabled={isPurging}
            className="flex items-center gap-2 bg-rose-600/10 border border-rose-500/20 text-rose-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
        >
            {isPurging ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Flame className="w-4 h-4" />
            )}
            {isPurging ? "Purificando..." : "Purificar Entorno"}
        </button>
    );
}
