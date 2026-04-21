"use client";

import * as React from "react";
import { Search, UserPlus, Users, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserSearchPaletteProps {
    onSelect: (user: { id: string; name: string }) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

/**
 * Buscador Táctico de Usuarios Federados.
 * Usa Command Palette para búsqueda rápida con debounce simulado o fetch real.
 */
export function UserSearchPalette({ onSelect, isOpen, setIsOpen }: UserSearchPaletteProps) {
    const [search, setSearch] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [results, setResults] = React.useState<any[]>([]);

    // Búsqueda táctica con debounce
    React.useEffect(() => {
        if (search.length < 2) {
            setResults([]);
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            try {
                // Fetch directo a una API endpoint minimalista o Server Action
                const response = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
                const data = await response.json();
                setResults(data.users || []);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl bg-black/95 border-slate-800 p-0 overflow-hidden shadow-2xl ring-1 ring-white/10">
                <DialogHeader className="p-4 border-b border-slate-800">
                    <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Reclutamiento de Autoridades
                    </DialogTitle>
                </DialogHeader>
                
                <Command className="bg-transparent text-slate-300">
                    <CommandInput 
                        placeholder="Buscar por nombre o correo..." 
                        value={search}
                        onValueChange={setSearch}
                        className="h-16 border-none focus:ring-0 text-lg bg-transparent"
                    />
                    
                    <CommandList className="max-h-[400px] border-t border-slate-800 custom-scrollbar">
                        {loading && (
                            <div className="p-8 flex justify-center items-center gap-3 text-slate-500 italic">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Escaneando base de datos...
                            </div>
                        )}
                        
                        {!loading && search.length >= 2 && results.length === 0 && (
                            <CommandEmpty className="p-8 text-center text-slate-500 italic">
                                No se encontraron registros coincidentes.
                            </CommandEmpty>
                        )}

                        <CommandGroup heading="Usuarios Federados">
                            {results.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    onSelect={() => {
                                        onSelect({ id: user.id, name: user.name || user.email });
                                        setIsOpen(false);
                                    }}
                                    className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer aria-selected:bg-white/10"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white">{user.name || "Usuario Sin Nombre"}</span>
                                        <span className="text-xs text-slate-500 font-mono uppercase">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                                            user.role === 'PLAYER' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-slate-700 text-slate-500'
                                        }`}>
                                            {user.role}
                                        </span>
                                        <UserPlus className="w-4 h-4 text-rose-500" />
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
                
                <div className="p-3 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-600 font-mono">
                    <span>ESC para cerrar</span>
                    <span className="text-rose-500 animate-pulse">WAR ROOM COMMAND SYSTEM</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
