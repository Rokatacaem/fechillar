"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareProfileButton({ playerName }: { playerName: string }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Error al copiar al portapapeles:", err);
        }
    };

    return (
        <button 
            onClick={handleShare}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                copied 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" 
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
        >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Enlace copiado" : "Compartir Perfil"}
        </button>
    );
}
