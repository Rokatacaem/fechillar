"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveGroupsGrid, LiveStandingsHeader } from "./LiveGroupsGrid";
import { LiveBrackets } from "./LiveBrackets";
import { LiveTopPerformers } from "./LiveTopPerformers";

type ViewType = "GROUPS" | "BRACKETS" | "PERFORMERS";

interface AutoRotationProps {
    tournament: any;
    groups: any[];
    matches: any[];
    topPerformers: any;
    rotationInterval?: number;
    clubLogo?: string | null;
}

export function AutoRotationContainer({ 
    tournament, 
    groups, 
    matches, 
    topPerformers, 
    rotationInterval = 45000,
    clubLogo
}: AutoRotationProps) {
    const [currentView, setCurrentView] = useState<ViewType>("GROUPS");

    useEffect(() => {
        const views: ViewType[] = ["GROUPS", "BRACKETS", "PERFORMERS"];
        let index = 0;

        const interval = setInterval(() => {
            index = (index + 1) % views.length;
            setCurrentView(views[index]);
        }, rotationInterval);

        return () => clearInterval(interval);
    }, [rotationInterval]);

    return (
        <div className="flex flex-col min-h-screen bg-[#020817] text-white">
            {/* Persistant Header */}
            <LiveStandingsHeader 
                title={tournament.name} 
                lastUpdate={new Date().toLocaleTimeString()} 
                clubLogo={clubLogo}
            />

            {/* Rotative Content Section */}
            <main className="flex-grow relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentView}
                        initial={{ opacity: 0, filter: "blur(10px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="w-full h-full"
                    >
                        {currentView === "GROUPS" && (
                            <div className="p-4">
                                <LiveGroupsGrid groups={groups} />
                            </div>
                        )}

                        {currentView === "BRACKETS" && (
                            <div className="flex flex-col items-center">
                                <h1 className="text-3xl font-black uppercase tracking-[0.3em] mb-4 text-[var(--color-accent)]">Cuadro Final</h1>
                                <LiveBrackets matches={matches} />
                            </div>
                        )}

                        {currentView === "PERFORMERS" && (
                            <div className="flex flex-col items-center">
                                <h1 className="text-3xl font-black uppercase tracking-[0.3em] mb-4 text-[var(--color-accent)]">Honor & Stats</h1>
                                <LiveTopPerformers performers={topPerformers} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Progress Bar (Visual indicator of next rotation) */}
            <div className="h-1 bg-slate-900 w-full overflow-hidden">
                <motion.div 
                    key={currentView} // Reset on view change
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: rotationInterval / 1000, ease: "linear" }}
                    className="h-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]"
                />
            </div>
        </div>
    );
}
