"use client";

import { useState } from "react";
import { Zap, Loader2, CheckCircle, AlertTriangle, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bulkActivateAllPlayers } from "@/app/admin/clubes/bulk-actions";
import { toast } from "sonner";

interface ActivationResult {
    activated: number;
    skipped: number;
    errors: string[];
    message: string;
}

export function BulkActivateButton() {
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [result, setResult] = useState<ActivationResult | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const handleActivate = async () => {
        if (!confirmed) {
            setConfirmed(true);
            return;
        }

        setLoading(true);
        setConfirmed(false);
        try {
            const res = await bulkActivateAllPlayers();
            if (res.success) {
                setResult({
                    activated: res.activated ?? 0,
                    skipped: res.skipped ?? 0,
                    errors: res.errors ?? [],
                    message: res.message ?? "",
                });
                toast.success(`${res.activated} jugadores activados exitosamente.`);
            } else {
                toast.error(res.error ?? "Error en activación masiva");
            }
        } catch {
            toast.error("Error inesperado durante la activación masiva.");
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        {result.activated} Activados
                        {result.skipped > 0 && (
                            <span className="text-amber-400 ml-2">· {result.skipped} omitidos</span>
                        )}
                    </p>
                    {result.errors.length > 0 && (
                        <button
                            onClick={() => setShowErrors(!showErrors)}
                            className="text-[9px] text-slate-500 underline flex items-center gap-1 mt-0.5"
                        >
                            Ver errores <ChevronDown className={`w-3 h-3 transition-transform ${showErrors ? "rotate-180" : ""}`} />
                        </button>
                    )}
                    {showErrors && (
                        <ul className="mt-2 space-y-0.5 max-h-24 overflow-y-auto">
                            {result.errors.map((e, i) => (
                                <li key={i} className="text-[9px] font-mono text-rose-400">{e}</li>
                            ))}
                        </ul>
                    )}
                </div>
                <button
                    onClick={() => setResult(null)}
                    className="text-slate-600 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    if (confirmed) {
        return (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex-1">
                    ¿Confirmas activación masiva?
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={handleActivate}
                        disabled={loading}
                        className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl active:scale-95 transition-all"
                    >
                        Confirmar
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmed(false)}
                        className="h-7 px-3 text-slate-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Button
            onClick={handleActivate}
            disabled={loading}
            className="h-10 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-[9px] rounded-2xl shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] active:scale-95 transition-all flex items-center gap-2 border-0"
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activando...
                </>
            ) : (
                <>
                    <Zap className="w-4 h-4" />
                    Activar Todos
                </>
            )}
        </Button>
    );
}
