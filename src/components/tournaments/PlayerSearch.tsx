"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Loader2, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { searchPlayers } from "@/app/(sgf)/players/actions";

interface SearchPlayerResult {
    id: string;
    name: string;
    rut: string | null;
    club: string;
}

export function PlayerSearch({ onSelect }: { onSelect?: (player: SearchPlayerResult) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<SearchPlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<SearchPlayerResult | null>(null);

  // Debouncing custom hook logic en-linea
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        const results = await searchPlayers(query);
        setPlayers(results);
        setLoading(false);
      } else {
        setPlayers([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="w-full inline-flex items-center justify-between bg-slate-950 border border-white/10 hover:bg-slate-900 text-slate-300 px-4 py-6 rounded-xl transition-all font-medium cursor-pointer"
        role="combobox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 overflow-hidden text-left">
            {selectedPlayer ? (
                <>
                    <User className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{selectedPlayer.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:inline-block">({selectedPlayer.club})</span>
                </>
            ) : (
                <>
                    <Search className="w-4 h-4 text-slate-500 shrink-0" />
                    Buscar afiliado por nombre o RUT...
                </>
            )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <Command className="bg-transparent" shouldFilter={false}>
          <CommandInput 
             placeholder="Escribe para buscar..." 
             className="text-white border-b border-white/5"
             value={query}
             onValueChange={setQuery}
          />
          <CommandList className="max-h-60 overflow-y-auto custom-scrollbar">
            {loading && (
                <div className="p-4 flex items-center justify-center text-emerald-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </div>
            )}
            {!loading && query.length >= 2 && players.length === 0 && (
                <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                    No se encontró ningún jugador.
                </CommandEmpty>
            )}
            <CommandGroup>
              {players.map((player) => (
                <CommandItem
                  key={player.id}
                  value={player.id}
                  className="text-white hover:bg-emerald-500/10 cursor-pointer flex justify-between items-center py-3"
                  onSelect={(currentValue) => {
                    setSelectedPlayer(player);
                    if (onSelect) onSelect(player);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div className="flex flex-col">
                      <span className="font-bold">{player.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{player.club}</span>
                  </div>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-emerald-500",
                      selectedPlayer?.id === player.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
