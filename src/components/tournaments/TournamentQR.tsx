"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Share2, MessageSquare } from "lucide-react";

interface Props {
    tournamentId: string;
    tournamentName: string;
    showLabel?: boolean;
    size?: number;
    groupName?: string;
    standingsSummary?: string;
}

export function TournamentQR({ tournamentId, tournamentName, showLabel = true, size = 150, groupName, standingsSummary }: Props) {
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    
    const publicUrl = `${typeof window !== "undefined" ? window.location.origin : "https://fechillar-three.vercel.app"}/torneos/${tournamentId}`;

    useEffect(() => {
        QRCode.toDataURL(publicUrl, {
            width: size,
            margin: 2,
            color: {
                dark: "#ffffff",
                light: "#00000000",
            },
        })
        .then((url: string) => setQrDataUrl(url))
        .catch((err: any) => console.error(err));
    }, [publicUrl, size]);

    const shareOnWhatsApp = () => {
        let textBody = `🏆 *${tournamentName}*\n`;
        
        if (groupName && standingsSummary) {
            textBody += `📊 Resumen del ${groupName}: ${standingsSummary}\n`;
        }

        textBody += `📱 Seguimiento en vivo: ${publicUrl}\n`;
        textBody += `\n⚖️ Nota: Si el resultado fue empate en carambolas, se define por Ganador del Arrime.`;

        const text = encodeURIComponent(textBody);
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-xl">
            {qrDataUrl ? (
                <div className="rounded-xl overflow-hidden">
                    <img src={qrDataUrl} alt="QR Torneo" width={size} height={size} />
                </div>
            ) : (
                <div className="rounded-xl bg-slate-800 animate-pulse" />
            )}
            
            {showLabel && (
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Seguimiento en Vivo</p>
                    <button 
                        onClick={shareOnWhatsApp}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg transition-all"
                    >
                        <MessageSquare className="w-3 h-3" />
                        Compartir Link
                    </button>
                </div>
            )}
        </div>
    );
}
