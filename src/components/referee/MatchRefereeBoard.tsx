"use client";

import { useState, useCallback, useEffect } from "react";
import { WEIGHTING_TABLE } from "@/lib/billiards/constants";
import { useShotClock } from "@/hooks/useShotClock";
import { syncMatchState } from "@/app/(referee)/match/[id]/actions";
import { evaluateMatchWinner, calculateCompletionPct } from "@/lib/billiards/match-engine";

interface PlayerState {
  id: string;
  name: string;
  score: number;
  target: number;
  innings: number;
  highRun: number;
  currentRun: number;
  photoUrl?: string | null;
}

export default function MatchRefereeBoard({ matchId, initialData }: { matchId: string, initialData?: any }) {
  const [home, setHome] = useState<PlayerState>({
    id: initialData?.homePlayer?.id || 'home-1',
    name: initialData?.homePlayer?.user?.name || 'Jugador 1',
    score: initialData?.homeScore || 0,
    target: initialData?.homeTarget || 30,
    innings: initialData?.homeInnings || 0,
    highRun: initialData?.homeHighRun || 0,
    currentRun: 0,
    photoUrl: initialData?.homePlayer?.photoUrl,
  });

  const [away, setAway] = useState<PlayerState>({
    id: initialData?.awayPlayer?.id || 'away-1', 
    name: initialData?.awayPlayer?.user?.name || 'Jugador 2', 
    score: initialData?.awayScore || 0, 
    target: initialData?.awayTarget || 30, 
    innings: initialData?.awayInnings || 0, 
    highRun: initialData?.awayHighRun || 0, 
    currentRun: 0,
    photoUrl: initialData?.awayPlayer?.photoUrl,
  });

  const [activePlayer, setActivePlayer] = useState<'HOME' | 'AWAY'>('HOME');
  const [phaseSettings] = useState({
    hasEqualizingInning: initialData?.phase?.hasEqualizingInning ?? true,
    inningLimit: initialData?.phase?.inningLimit ?? 30
  });

  const clock = useShotClock(40);

  // Evaluar estado del partido usando el motor centralizado
  const result = evaluateMatchWinner({
    homeScore: home.score,
    awayScore: away.score,
    homeTarget: home.target,
    awayTarget: away.target,
    homeInnings: home.innings,
    awayInnings: away.innings,
    hasEqualizingInning: phaseSettings.hasEqualizingInning,
    inningLimit: phaseSettings.inningLimit
  });

  const matchEnded = result.isFinished;

  // Optimistic Polling Simulation for TV & Audit Logging
  const updateStore = useCallback(async (payload: any) => {
    try {
        await syncMatchState(matchId, payload);
    } catch (e) {
        console.error("Fallo de Transparencia: Error al registrar movimiento", e);
    }
  }, [matchId]);

  const handleAddPoint = () => {
    if (matchEnded) return;

    if (activePlayer === 'HOME') {
      const newScore = home.score + 1;
      const newRun = home.currentRun + 1;
      setHome({ ...home, score: newScore, currentRun: newRun, highRun: Math.max(home.highRun, newRun) });
      updateStore({ action: 'addPoint', player: 'HOME', score: newScore });
    } else {
      const newScore = away.score + 1;
      const newRun = away.currentRun + 1;
      setAway({ ...away, score: newScore, currentRun: newRun, highRun: Math.max(away.highRun, newRun) });
      updateStore({ action: 'addPoint', player: 'AWAY', score: newScore });
    }
    clock.reset();
  };

  const handleEndInning = () => {
    if (matchEnded) return;

    if (activePlayer === 'HOME') {
      const newInnings = home.innings + 1;
      setHome({ ...home, innings: newInnings, currentRun: 0 });
      setActivePlayer('AWAY');
      updateStore({ action: 'endInning', player: 'HOME', innings: newInnings });
    } else {
      const newInnings = away.innings + 1;
      setAway({ ...away, innings: newInnings, currentRun: 0 });
      setActivePlayer('HOME');
      updateStore({ action: 'endInning', player: 'AWAY', innings: newInnings });
    }
    clock.reset();
  };

  const handleZero = () => {
    handleEndInning();
  };

  const handleExtension = () => {
    if (matchEnded) return;
    clock.addExtension();
  };

  const homePct = calculateCompletionPct(home.score, home.target);
  const awayPct = calculateCompletionPct(away.score, away.target);

  const isGraciaAlert = phaseSettings.hasEqualizingInning && home.score >= home.target && (home.innings > away.innings);

  useEffect(() => {
    if (!matchEnded && !clock.isActive && !clock.isZero) clock.reset();
    if (matchEnded) clock.reset(); // Stop clock on end
  }, [matchEnded]);

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden p-4 select-none bg-slate-950">
      {/* OVERLAY DE GANADOR */}
      {matchEnded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="text-center">
              <div className="text-emerald-500 font-black text-9xl uppercase tracking-tighter mb-4 animate-bounce">
                {result.winner === 'DRAW' ? 'EMPATE' : 'GANADOR'}
              </div>
              <p className="text-white text-3xl font-bold uppercase tracking-[0.5em] opacity-80">
                {result.reason}
              </p>
              <div className="mt-12 flex gap-8 justify-center">
                 <div className="bg-slate-900 p-6 rounded-3xl border border-white/10">
                    <p className="text-slate-500 text-sm font-bold uppercase mb-1">Resultado Final</p>
                    <p className="text-5xl font-mono font-black">{home.score} - {away.score}</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* HEADER: Scoreboard */}
      <div className="flex justify-between items-stretch mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg shrink-0">
         <div className={`flex flex-col items-center flex-1 transition-opacity ${activePlayer === 'HOME' ? 'text-emerald-400' : 'text-slate-400 opacity-70'}`}>
             <div className="flex items-center gap-4 mb-2">
                <div className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all ${activePlayer === 'HOME' ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-800'}`}>
                    {home.photoUrl ? (
                        <img src={home.photoUrl} alt={home.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xl font-black">
                            {home.name[0]}
                        </div>
                    )}
                </div>
                <h2 className="text-4xl font-bold truncate max-w-[200px]">{home.name}</h2>
             </div>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-xs uppercase tracking-widest opacity-70">Meta: {home.target}</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-white font-mono">{homePct.toFixed(1)}%</span>
             </div>
             <div className="text-8xl font-black mt-2 font-mono leading-none">{home.score}</div>
             <div className="flex gap-4 mt-3 text-sm opacity-80 bg-slate-950/50 px-4 py-1.5 rounded-full">
                <span>E: <strong className="text-white">{home.innings}</strong></span>
                <span>R: <strong className="text-white">{home.highRun}</strong></span>
             </div>
         </div>

         <div className="flex flex-col items-center flex-none w-48 justify-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 transition-colors duration-300 shadow-xl
                ${clock.isZero ? 'bg-red-800 border-red-500 animate-pulse text-white' : 
                  clock.isCritical ? 'bg-red-950/80 border-red-600 animate-pulse text-red-500' : 
                  'bg-slate-950 border-slate-700 text-slate-200'}`}>
                <span className="text-6xl font-black font-mono tracking-tighter">{clock.seconds}</span>
            </div>
            {isGraciaAlert && (
                 <div className="mt-4 bg-amber-600 text-white font-bold px-4 py-2 rounded-full text-[10px] text-center uppercase tracking-widest animate-pulse">Contrasalida Activa</div>
            )}
            {!phaseSettings.hasEqualizingInning && (
                 <div className="mt-4 bg-rose-600/20 text-rose-400 border border-rose-500/30 font-bold px-3 py-1 rounded text-[10px] text-center uppercase tracking-widest">Sin Contrasalida</div>
            )}
         </div>

         <div className={`flex flex-col items-center flex-1 transition-opacity ${activePlayer === 'AWAY' ? 'text-emerald-400' : 'text-slate-400 opacity-70'}`}>
             <div className="flex items-center gap-4 mb-2">
                <h2 className="text-4xl font-bold truncate max-w-[200px]">{away.name}</h2>
                <div className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all ${activePlayer === 'AWAY' ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-800'}`}>
                    {away.photoUrl ? (
                        <img src={away.photoUrl} alt={away.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xl font-black">
                            {away.name[0]}
                        </div>
                    )}
                </div>
             </div>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-xs uppercase tracking-widest opacity-70">Meta: {away.target}</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-white font-mono">{awayPct.toFixed(1)}%</span>
             </div>
             <div className="text-8xl font-black mt-2 font-mono leading-none">{away.score}</div>
             <div className="flex gap-4 mt-3 text-sm opacity-80 bg-slate-950/50 px-4 py-1.5 rounded-full">
                <span>E: <strong className="text-white">{away.innings}</strong></span>
                <span>R: <strong className="text-white">{away.highRun}</strong></span>
             </div>
         </div>
      </div>

      {/* CONTROLS */}
      <div className="flex-1 grid grid-cols-2 gap-4 pb-2">
        <div className="col-span-2 flex justify-between items-center bg-slate-800 px-6 py-2 rounded-full border border-slate-700">
           <span className="text-slate-300 font-medium font-sans">
              Turno: <strong className="text-white ml-2 text-lg">{activePlayer === 'HOME' ? home.name : away.name}</strong> 
              <span className="ml-6 text-emerald-400 font-mono">SERIE: {activePlayer === 'HOME' ? home.currentRun : away.currentRun}</span>
           </span>
           <div className="flex items-center gap-4">
              <span className="text-amber-400 font-bold uppercase text-xs">Ext: {clock.extensionsCount}</span>
              <button 
                  onClick={handleExtension} 
                  disabled={clock.extensionsCount === 0 || matchEnded}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-full shadow font-bold text-xs uppercase transition-transform active:scale-95">
                  +40s
              </button>
           </div>
        </div>

        <button 
           onClick={handleAddPoint}
           disabled={matchEnded}
           className="disabled:opacity-20 bg-emerald-600 text-white rounded-[3rem] shadow-2xl flex flex-col items-center justify-center transition-all transform active:scale-[0.95] border-b-[12px] border-emerald-800"
        >
            <span className="text-[12rem] font-black leading-none">+1</span>
            <span className="text-3xl font-black mt-4 uppercase tracking-[0.5em] opacity-90">Buena</span>
        </button>

        <div className="flex flex-col gap-4">
            <button 
               onClick={handleZero}
               disabled={matchEnded}
               className="flex-1 disabled:opacity-20 bg-slate-800 border-b-[12px] border-slate-950 text-slate-300 rounded-[3rem] shadow-xl flex flex-col items-center justify-center transition-transform active:scale-[0.95]"
            >
                <span className="text-9xl font-black mb-1 opacity-80 leading-none">0</span>
                <span className="text-2xl font-black uppercase tracking-[0.3em] opacity-80">Mala</span>
            </button>
            <button 
               onClick={handleEndInning}
               disabled={matchEnded}
               className="flex-1 disabled:opacity-20 bg-rose-700 border-b-[12px] border-rose-950 text-white rounded-[3rem] shadow-xl flex flex-col items-center justify-center transition-transform active:scale-[0.95]"
            >
                <span className="text-4xl font-black uppercase tracking-widest text-center px-4 leading-tight mb-1">Fin Entrada</span>
            </button>
        </div>
      </div>
    </div>
  );
}

