"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Trophy, Star, Radio } from "lucide-react";
import { LiveGroupsGrid } from "./LiveGroupsGrid";
import { LiveBrackets } from "./LiveBrackets";
import { LiveTopPerformers } from "./LiveTopPerformers";

type MobileTab = "LIVE" | "TABLES" | "BRACKET" | "STATS";

interface MobileSwipeInterfaceProps {
    tournament: any;
    groups: any[];
    matches: any[];
    topPerformers: any;
}

export function MobileSwipeInterface({ 
    tournament, 
    groups, 
    matches, 
    topPerformers 
}: MobileSwipeInterfaceProps) {
    const [activeTab, setActiveTab] = useState<MobileTab>("TABLES");

    const tabs: { id: MobileTab; label: string; icon: any }[] = [
        { id: "TABLES", label: "Grupos", icon: LayoutGrid },
        { id: "BRACKET", label: "Cuadro", icon: Trophy },
        { id: "STATS", label: "Stats", icon: Star },
    ];

    return (
        <div className="flex flex-col h-screen bg-[#020817] text-white">
            {/* Simple Mobile Header */}
            <header className="p-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-lg flex justify-between items-center sticky top-0 z-20">
                <div>
                   <h2 className="text-sm font-black uppercase tracking-tight text-white">{tournament.name}</h2>
                   <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">En Vivo</p>
                </div>
                <div className="p-2 rounded-full bg-emerald-500/10">
                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
            </header>

            {/* Swipeable Area */}
            <main className="flex-grow overflow-y-auto pb-24 touch-pan-y">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full"
                        // Implementación de Swipe simple con Framer Motion
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_, info) => {
                            const swipeThreshold = 50;
                            const currentIndex = tabs.findIndex(t => t.id === activeTab);
                            if (info.offset.x > swipeThreshold && currentIndex > 0) {
                                setActiveTab(tabs[currentIndex - 1].id);
                            } else if (info.offset.x < -swipeThreshold && currentIndex < tabs.length - 1) {
                                setActiveTab(tabs[currentIndex + 1].id);
                            }
                        }}
                    >
                        {activeTab === "TABLES" && (
                            <div className="p-2">
                                <LiveGroupsGrid groups={groups} />
                            </div>
                        )}

                        {activeTab === "BRACKET" && (
                            <div className="flex flex-col items-center">
                                <LiveBrackets matches={matches} />
                            </div>
                        )}

                        {activeTab === "STATS" && (
                            <div className="p-4">
                                <LiveTopPerformers performers={topPerformers} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Nav Tabs */}
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 pb-safe z-30">
                <div className="flex justify-around items-center h-20 px-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-col items-center gap-1.5 transition-all w-full relative ${isActive ? 'text-emerald-500' : 'text-slate-600'}`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : 'scale-100'} transition-transform`} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute -top-4 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" 
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
