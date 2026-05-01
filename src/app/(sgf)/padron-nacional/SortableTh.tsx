"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type SortKey = "nombre" | "club" | "ranking" | "promedio" | "puntos";
type SortDir = "asc" | "desc";

interface SortableThProps {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
}

/**
 * Cabecera de columna ordenable.
 * Al hacer clic genera un nuevo URL con ?sort=key&dir=asc|desc
 * y lo navega sin perder el resto de los search params.
 */
export function SortableTh({ label, sortKey, currentSort, currentDir }: SortableThProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = currentSort === sortKey;
  const nextDir: SortDir = isActive && currentDir === "asc" ? "desc" : "asc";

  const params = new URLSearchParams(searchParams.toString());
  params.set("sort", sortKey);
  params.set("dir", nextDir);
  const href = `${pathname}?${params.toString()}`;

  return (
    <th className="px-6 py-4 text-left">
      <Link
        href={href}
        className={`
          inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider
          transition-colors select-none
          ${isActive ? "text-emerald-400" : "text-slate-400 hover:text-white"}
        `}
      >
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-40" />
        )}
      </Link>
    </th>
  );
}
