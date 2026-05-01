"use client";

import { useState } from "react";
import { TransitionToBrackets } from "../grupos/TransitionToBrackets";
import { Trophy } from "lucide-react";

export function TransitionToBracketsWrapper({ tournamentId }: { tournamentId: string }) {
    const [show, setShow] = useState(false);

    return (
        <>
            <button
                onClick={() => setShow(true)}
                className="w-full py-4 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
                <Trophy className="w-4 h-4" />
                Transicionar a Cuadros (Eliminatorias)
            </button>
            {show && <TransitionToBrackets tournamentId={tournamentId} onClose={() => setShow(false)} />}
        </>
    );
}
