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

    const sorted = [...groups].sort((a, b) => a.name.localeCompare(b.name));
    const totalMatches = groups.reduce((a, g) => a + g.total, 0);
    const completedMatches = groups.reduce((a, g) => a + g.completed, 0);
    const selectedInfo = sorted.find(g => g.name === selectedGroup);

    return (
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
            <select
                value={selectedGroup ?? ""}
                onChange={(e) => select(e.target.value || null)}
                aria-label="Filtrar por grupo"
                className="flex-1 bg-slate-800 border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            >
                <option value="">Todos los grupos ({totalMatches} partidas)</option>
                {sorted.map((g) => {
                    const isDone = g.completed === g.total && g.total > 0;
                    return (
                        <option key={g.name} value={g.name}>
                            {isDone ? "✓ " : ""}{g.label} — {g.completed}/{g.total}
                        </option>
                    );
                })}
            </select>

            {selectedInfo && (
                <div className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {selectedInfo.completed}/{selectedInfo.total}
                    {selectedInfo.completed === selectedInfo.total && selectedInfo.total > 0 && (
                        <span className="ml-1.5 text-emerald-500">✓</span>
                    )}
                </div>
            )}
            {!selectedGroup && (
                <div className="shrink-0 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {completedMatches}/{totalMatches}
                </div>
            )}
        </div>
    );
}
