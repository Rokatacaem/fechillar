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

export function TournamentQR({ tournamentId, tournamentName, showLabel = true, size = 150 }: Props) {
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    
    // Asumimos la URL de producción (Vercel)
    const publicUrl = `https://nacional-mayo.fechillar.cl/torneos/${tournamentId}`;

    useEffect(() => {
        QRCode.toDataURL(publicUrl, {
            width: size,
            margin: 2,
            color: {
                dark: "#ffffff",
                light: "#00000000",
            },
        })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
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
            {qrDataUrl && (
                <div className="bg-white p-2 rounded-xl">
                    <img src={qrDataUrl} alt="Tournament QR" className="w-full h-auto" style={{ width: size, height: size }} />
                </div>
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
