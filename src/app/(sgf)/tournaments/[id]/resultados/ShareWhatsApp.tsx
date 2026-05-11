"use client";

import { useState } from "react";
import { MessageCircle, Loader2, Check } from "lucide-react";
import { getTournamentWhatsAppReport } from "./actions";

export function ShareWhatsApp({ tournamentId }: { tournamentId: string }) {
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        setLoading(true);
        try {
            const text = await getTournamentWhatsAppReport(tournamentId);
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, "_blank", "noopener,noreferrer");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        setLoading(true);
        try {
            const text = await getTournamentWhatsAppReport(tournamentId);
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleShare}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <MessageCircle className="w-3.5 h-3.5" />
                )}
                WhatsApp
            </button>

            <button
                onClick={handleCopy}
                disabled={loading}
                title="Copiar texto al portapapeles"
                className="px-3 py-3 rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
                {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                    <span className="text-[9px] font-black uppercase tracking-widest">COPY</span>
                )}
            </button>
        </div>
    );
}
