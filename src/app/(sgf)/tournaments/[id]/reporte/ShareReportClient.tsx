"use client";

import { useState } from "react";
import { Share2, Copy, Trophy, Clock, Users, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface GroupData {
    id: string;
    name: string;
    registrations: {
        registeredAverage: number | null;
        preferredTurn: string | null;
        player: {
            firstName: string;
            lastName: string;
            club: { name: string } | null;
        };
    }[];
}

interface ShareReportClientProps {
    tournamentName: string;
    turns: {
        [key: string]: GroupData[];
    };
}

export function ShareReportClient({ tournamentName, turns }: ShareReportClientProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToWhatsApp = (turnLabel: string, groups: GroupData[]) => {
        let text = `🏆 *${tournamentName.toUpperCase()}*\n`;
        text += `🕒 *TURNO: ${turnLabel}*\n`;
        text += `────────────────\n\n`;

        groups.forEach(g => {
            // Limpiar nombre del grupo de la hora (ya está en el encabezado)
            const cleanName = g.name.split(' (')[0];
            text += `*${cleanName}*\n`;
            
            if (g.registrations.length === 0) {
                text += `_(Sin jugadores asignados)_\n`;
            } else {
                g.registrations.forEach((reg, idx) => {
                    const playerName = `${reg.player.firstName} ${reg.player.lastName}`;
                    const avg = reg.registeredAverage ? reg.registeredAverage.toFixed(3) : "0.000";
                    const turn = reg.preferredTurn ? ` [${reg.preferredTurn}]` : "";
                    text += `${idx + 1}. ${playerName} (${avg})${turn}\n`;
                });
            }
            text += `\n`;
        });

        text += `_Generado por Fechillar SGF_`;

        navigator.clipboard.writeText(text);
        setCopied(turnLabel);
        toast.success(`Resumen del turno ${turnLabel} copiado`);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-md mx-auto space-y-10">
            {Object.entries(turns).map(([label, groups]) => (
                <div key={label} className="space-y-4">
                    {/* Turn Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">
                                Turno {label}
                            </h2>
                        </div>
                        <button 
                            onClick={() => copyToWhatsApp(label, groups)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-black uppercase rounded-lg transition-all border border-emerald-500/20"
                        >
                            {copied === label ? <Check className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                            {copied === label ? "Copiado" : "WhatsApp"}
                        </button>
                    </div>

                    {/* Group Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {groups.map((group, idx) => (
                            <div 
                                key={group.id} 
                                className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all"
                            >
                                {/* Background Accent */}
                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-all" />
                                
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xs font-black text-white bg-slate-800 px-2.5 py-1 rounded-md border border-white/5">
                                        {group.name.split(' (')[0]}
                                    </h3>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                        Mesa {idx + 1}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {group.registrations.length === 0 ? (
                                        <div className="py-4 text-center">
                                            <p className="text-[10px] font-medium text-slate-500 italic">Sin jugadores asignados</p>
                                        </div>
                                    ) : (
                                        group.registrations.map((reg, pIdx) => (
                                            <div key={pIdx} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center text-[9px] font-black text-slate-400">
                                                    {pIdx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-white truncate leading-none uppercase">
                                                        {reg.player.firstName} {reg.player.lastName}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight truncate">
                                                            {reg.player.club?.name || "LIBRE"}
                                                        </p>
                                                        <span className="text-[8px] text-emerald-500 font-black">
                                                            {reg.registeredAverage ? reg.registeredAverage.toFixed(3) : "0.000"}
                                                        </span>
                                                        {reg.preferredTurn && (
                                                            <span className="text-[7px] bg-slate-800 text-slate-400 px-1 rounded border border-white/5 font-bold">
                                                                {reg.preferredTurn}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Hint */}
            <div className="p-6 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                <Share2 className="w-5 h-5 text-slate-600 mx-auto mb-2" />
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Usa el botón <span className="text-emerald-500 font-bold">WhatsApp</span> para copiar el resumen de texto,<br />
                    o toma una <span className="text-white font-bold">captura de pantalla</span> de estas tarjetas para enviarlas como imagen.
                </p>
            </div>
        </div>
    );
}
