"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useShotClock } from "@/hooks/useShotClock";
import { emitMatchRealtimeUpdate } from "@/lib/realtime/useMatchSync";

export default function RefereeMobileUX() {
  const params = useParams();
  const matchId = params.id as string;
  const clock = useShotClock(40);
  
  // Tactical Haptic Action
  const triggerHaptic = (ms: number) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(ms);
    }
  };

  const handleShootPoint = () => {
      triggerHaptic([50, 50]); // Doble vibración corta
      clock.reset();
      emitMatchRealtimeUpdate(matchId, { action: 'score_add' });
  };

  const handleMiss = () => {
      triggerHaptic([100]); // Vibración seca
      clock.pause();
      emitMatchRealtimeUpdate(matchId, { action: 'miss' });
  };

  const handleExtension = () => {
      triggerHaptic(200); // Vibración larga confirmación
      clock.addExtension();
      emitMatchRealtimeUpdate(matchId, { action: 'extension' });
  };

  // Autovibración extrema si llegamos a cero
  useEffect(() => {
    if (clock.isZero) {
        triggerHaptic([300, 100, 300]); 
    }
  }, [clock.isZero]);

  return (
      <main className="h-[100dvh] w-screen bg-slate-950 overflow-hidden flex flex-col text-slate-100 select-none">
          <div className="flex-none p-4 flex justify-between bg-slate-900 shadow-sm border-b border-slate-800">
             <div>
                <div className="text-xs font-bold text-slate-500 tracking-widest uppercase">MESA 1</div>
                <div className="text-lg font-black text-emerald-400">Juez Autorizado</div>
             </div>
             <div className="text-right">
                <div className={`text-4xl font-mono font-black ${clock.isCritical ? 'text-rose-500 animate-pulse' : 'text-slate-100'}`}>
                    {clock.seconds}s
                </div>
             </div>
          </div>

          <div className="flex-1 flex flex-col p-4 gap-4">
              <button 
                  onClick={handleShootPoint}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] rounded-3xl border-b-8 border-emerald-800 shadow-xl flex flex-col items-center justify-center transition-all touch-manipulation focus:outline-none"
              >
                  <span className="text-[10rem] leading-none font-black opacity-90 drop-shadow-md">+1</span>
                  <span className="text-2xl mt-2 tracking-[0.4em] font-medium opacity-80">CARAMBOLA</span>
              </button>

              <div className="flex-1 flex gap-4">
                  <button 
                      onClick={handleMiss}
                      className="flex-1 bg-slate-800 active:bg-slate-700 active:scale-95 rounded-3xl border-b-8 border-slate-900 shadow-lg flex flex-col items-center justify-center transition-all touch-manipulation focus:outline-none"
                  >
                     <span className="text-6xl font-black mb-2 opacity-80 leading-none">0</span>
                     <span className="text-xl tracking-widest font-bold opacity-60">FALLA</span>
                  </button>

                  <button 
                      onClick={handleExtension}
                      className="flex-1 bg-amber-600 active:bg-amber-500 active:scale-95 rounded-3xl border-b-8 border-amber-800 shadow-lg flex flex-col items-center justify-center transition-all touch-manipulation focus:outline-none"
                  >
                     <span className="text-4xl font-black mb-2 text-amber-100 drop-shadow">+Ext</span>
                     <span className="text-xs uppercase tracking-wider font-bold opacity-80">({clock.extensionsCount} disp)</span>
                  </button>
              </div>
          </div>
      </main>
  );
}
