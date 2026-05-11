"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface GroupInfo {
    name: string;
    label: string;
    total: number;
    completed: number;
}

interface Props {
    groups: GroupInfo[];
    selectedGroup: string | null;
}

export function GroupFilterBar({ groups, selectedGroup }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const select = useCallback((group: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (group) {
            params.set("group", group);
        } else {
            params.delete("group");
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, searchParams]);

    if (groups.length <= 1) return null;

    return (
        <div className="flex flex-wrap gap-2 pb-3 border-b border-white/5">
            {/* Botón "Todos" */}
            <button
                onClick={() => select(null)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    !selectedGroup
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-500 border border-white/5 hover:text-slate-300"
                }`}
            >
                Todos ({groups.reduce((a, g) => a + g.total, 0)})
            </button>

            {groups.map((g) => {
                const isActive = selectedGroup === g.name;
                const isDone = g.completed === g.total && g.total > 0;
                return (
                    <button
                        key={g.name}
                        onClick={() => select(g.name)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                            isActive
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-500 border border-white/5 hover:text-slate-300"
                        }`}
                    >
                        {isDone && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                        {g.label}
                        <span className={`text-[9px] font-bold ${isDone ? "text-emerald-600" : "text-slate-600"}`}>
                            {g.completed}/{g.total}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
