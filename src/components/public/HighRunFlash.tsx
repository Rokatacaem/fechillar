"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy } from "lucide-react";

interface HighRunFlashProps {
    playerName: string;
    runValue: number;
    onComplete: () => void;
}

export function HighRunFlash({ playerName, runValue, onComplete }: HighRunFlashProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 10000); // 10 segundos aprobado

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[40] flex items-center justify-center bg-black/80 backdrop-blur-xl"
            >
                {/* Neon Pulse Background */}
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut" 
                    }}
                    className="absolute w-[600px] h-[600px] bg-[var(--color-accent)]/20 rounded-full blur-[120px]"
                />

                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -50, opacity: 0, scale: 0.9 }}
                    className="relative text-center space-y-8 p-12"
                >
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-3xl bg-[var(--color-accent)] flex items-center justify-center shadow-[0_0_50px_var(--color-accent)]">
                            <Zap className="w-12 h-12 text-white fill-current" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">
                            ¡NUEVA SERIE <span className="text-[var(--color-accent)] animate-pulse">MAYOR</span>!
                        </h2>
                        <p className="text-slate-400 text-xl font-bold uppercase tracking-[0.5em]">Récord del Torneo Superado</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-md">
                        <p className="text-4xl font-black text-white uppercase mb-2">{playerName}</p>
                        <div className="flex items-center justify-center gap-4">
                            <Trophy className="w-6 h-6 text-amber-500" />
                            <p className="text-7xl font-black text-[var(--color-accent)] font-mono">
                                {runValue} <span className="text-2xl text-slate-500">Carambolas</span>
                            </p>
                        </div>
                    </div>

                    <div className="pt-8">
                         <div className="flex justify-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <motion.div 
                                    key={i}
                                    animate={{ 
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{ delay: i * 0.1, repeat: Infinity, duration: 1 }}
                                    className="w-2 h-2 rounded-full bg-[var(--color-accent)]"
                                />
                            ))}
                         </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
