"use client";

import { useState } from "react";

interface Referee {
  id: string;
  name: string;
  role: string;
}

interface RefereeAssignerProps {
  matchId: string;
  currentRefereeId?: string | null;
  availableReferees: Referee[];
}

export default function RefereeAssigner({ matchId, currentRefereeId, availableReferees }: RefereeAssignerProps) {
  const [selectedId, setSelectedId] = useState(currentRefereeId || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAssign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedId(newId);
    setIsUpdating(true);
    
    // Server action trigger
    // await updateMatchReferee(matchId, newId);
    
    setTimeout(() => {
        setIsUpdating(false);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-2 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Juez Oficial
        </label>
        <div className="relative">
            <select 
                value={selectedId} 
                onChange={handleAssign}
                disabled={isUpdating}
                className="w-full appearance-none bg-slate-950 border border-slate-700 hover:border-emerald-500/50 text-slate-200 rounded-lg py-2.5 pl-4 pr-10 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50"
            >
                <option value="" disabled>Seleccionar Árbitro...</option>
                {availableReferees.map((ref) => (
                    <option key={ref.id} value={ref.id}>
                        {ref.name} (ID: {ref.id.slice(0,4)})
                    </option>
                ))}
            </select>
            
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {isUpdating ? (
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                ) : (
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                )}
            </div>
        </div>
    </div>
  );
}
