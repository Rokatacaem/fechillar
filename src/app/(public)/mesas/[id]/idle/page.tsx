"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Videos & Assets de Federación
// En producción, estos vendrán de la base de datos o CMS
const IDLE_MEDIA = [
    { type: "video", src: "/media/federation-promo-1.mp4", duration: 30000 },
    { type: "video", src: "/media/wor-highlights.mp4", duration: 25000 },
];

const SPONSORS_TICKR = ["WOR — World Billiards Organization", "Fechillar — Federación Chilena", "Predator Cues Official", "Aramith Premium Balls"];

export default function IdleTableScreen({ params }: { params: { id: string } }) {
    const [mediaIndex, setMediaIndex] = useState(0);
    const [tickerIndex, setTickerIndex] = useState(0);
    const current = IDLE_MEDIA[mediaIndex];

    // Rotar medios según su duración
    useEffect(() => {
        const timer = setTimeout(() => {
            setMediaIndex(i => (i + 1) % IDLE_MEDIA.length);
        }, current.duration);
        return () => clearTimeout(timer);
    }, [mediaIndex, current.duration]);

    // Ticker de Sponsors (cada 6s)
    useEffect(() => {
        const interval = setInterval(() => {
            setTickerIndex(i => (i + 1) % SPONSORS_TICKR.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-screen h-screen bg-[#04070f] overflow-hidden relative select-none">

            {/* VIDEO DE FONDO / FALLBACK */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={mediaIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="absolute inset-0"
                >
                    {current.type === "video" ? (
                        <video
                            key={current.src}
                            autoPlay muted loop playsInline
                            className="w-full h-full object-cover opacity-40"
                        >
                            <source src={current.src} type="video/mp4" />
                        </video>
                    ) : (
                        <img src={current.src} className="w-full h-full object-cover opacity-40" />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* GRADIENTE DE PROFUNDIDAD */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#04070f] via-transparent to-[#04070f]/70 pointer-events-none" />

            {/* CENTRO: Logo + Mesa */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
                {/* Logo Federación */}
                <motion.div
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="flex flex-col items-center"
                >
                    <div className="text-emerald-500 text-[7rem] font-black tracking-tighter leading-none">FC</div>
                    <div className="text-white text-2xl font-bold tracking-[0.5em] uppercase border-t border-emerald-500 pt-3 mt-3">Fechillar</div>
                    <div className="text-slate-400 text-sm uppercase tracking-[0.3em] mt-1">Federación Chilena de Billar</div>
                </motion.div>

                {/* Indicador de Mesa */}
                <div className="bg-slate-900/80 border border-slate-700 text-slate-200 px-10 py-4 rounded-2xl backdrop-blur text-center">
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">Próximo partido en</div>
                    <div className="text-5xl font-black text-white font-mono">Mesa {params.id.slice(-3).toUpperCase()}</div>
                    <div className="text-emerald-400 text-sm mt-2 uppercase tracking-wider font-bold">-- Sin Partido Asignado --</div>
                </div>

                {/* Logos WOR */}
                <div className="flex items-center gap-6 mt-6">
                    <div className="text-slate-400 text-xs uppercase tracking-widest">Miembro oficial</div>
                    <div className="border border-slate-700 bg-slate-900/60 text-slate-200 px-6 py-2 rounded-lg font-black tracking-widest text-sm">WOR</div>
                    <div className="text-slate-600 text-xs">World Billiards Organization</div>
                </div>
            </div>

            {/* TICKER DE SPONSORS — Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0b1120]/90 border-t border-slate-800 backdrop-blur h-16 flex items-center px-8 gap-8 overflow-hidden">
                <div className="text-emerald-400 font-black uppercase tracking-widest text-sm shrink-0 border-r border-slate-700 pr-6">
                    Patrocinadores
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tickerIndex}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.4 }}
                        className="text-white font-bold text-lg uppercase tracking-widest"
                    >
                        {SPONSORS_TICKR[tickerIndex]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* TIMESTAMP — Esquina */}
            <div className="absolute top-6 right-8 font-mono text-slate-500 text-sm">
                {new Date().toLocaleTimeString("es-CL")}
            </div>
        </div>
    );
}
