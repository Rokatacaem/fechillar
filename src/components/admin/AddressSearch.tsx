"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Loader2, X, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface AddressSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSelectAddress?: (details: any) => void;
}

export function AddressSearch({ value, onChange, placeholder = "Buscar dirección...", onSelectAddress }: AddressSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!query || query.length < 3) {
            setResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Quitamos el BBox temporalmente por ser muy restrictivo en Photon
                // En su lugar, añadimos un sesgo textual hacia Chile
                const finalQuery = query.toLowerCase().includes("chile") ? query : `${query}, Chile`;
                const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(finalQuery)}&lang=es&limit=10`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                console.log("Photon Query:", finalQuery, "Results:", data.features?.length);
                
                if (data.features) {
                    setResults(data.features);
                }
            } catch (error) {
                console.error("Geocoding error:", error);
            } finally {
                setIsLoading(false);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [query]);

    const handleSelect = (feature: any) => {
        const { properties } = feature;
        const street = properties.street ? `${properties.street} ${properties.housenumber || ""}` : properties.name;
        const city = properties.city || properties.state || "";
        const fullAddress = city ? `${street}, ${city}` : street;
        
        onChange(fullAddress);
        if (onSelectAddress) {
            onSelectAddress({
                fullAddress,
                city,
                street: properties.street,
                houseNumber: properties.housenumber,
                name: properties.name
            });
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger 
                nativeButton={false}
                render={
                    <div className="relative group cursor-text" onClick={() => setOpen(true)}>
                        <MapPin className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                            value ? "text-blue-500" : "text-slate-600 group-hover:text-slate-400"
                        )} />
                        <div className={cn(
                            "w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-10 py-3.5 text-sm transition-all min-h-[50px] flex items-center",
                            open ? "border-blue-500/50 ring-2 ring-blue-500/10" : "group-hover:border-slate-700"
                        )}>
                            {value ? (
                                <span className="text-slate-200">{value}</span>
                            ) : (
                                <span className="text-slate-600">{placeholder}</span>
                            )}
                        </div>
                        {value && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange("");
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded-md text-slate-600 hover:text-white transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                }
            />
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] bg-slate-900 border-slate-800 shadow-2xl overflow-hidden" align="start">
                <Command className="bg-transparent" shouldFilter={false}>
                    <div className="flex items-center border-b border-slate-800 px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                        <CommandInput 
                            placeholder="Escribe para buscar en Chile..." 
                            value={query}
                            onValueChange={setQuery}
                            className="h-12 bg-transparent focus:ring-0 border-0"
                        />
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    </div>
                    <CommandList className="max-h-[300px]">
                        {query.length > 0 && query.length < 3 && (
                            <div className="py-6 text-center text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                Escribe al menos 3 caracteres...
                            </div>
                        )}
                        {query.length >= 3 && results.length === 0 && !isLoading && (
                            <CommandEmpty className="py-10 text-slate-500 text-xs text-center font-mono">
                                No se encontraron resultados en Chile.
                            </CommandEmpty>
                        )}
                        <CommandGroup heading="Resultados Sugeridos">
                            {results.map((feature, i) => {
                                const { properties } = feature;
                                const mainText = properties.street ? `${properties.street} ${properties.housenumber || ""}` : properties.name;
                                const subText = [properties.city, properties.state, properties.country].filter(Boolean).join(", ");
                                
                                return (
                                    <CommandItem
                                        key={i}
                                        onSelect={() => handleSelect(feature)}
                                        className="flex flex-col items-start gap-1 py-3 px-4 aria-selected:bg-slate-800/50 cursor-pointer border-b border-white/[0.02]"
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                                            <span className="font-bold text-slate-200 line-clamp-1 text-xs">{mainText}</span>
                                        </div>
                                        {subText && (
                                            <span className="text-[10px] text-slate-500 font-mono pl-5 line-clamp-1 uppercase tracking-tight">
                                                {subText}
                                            </span>
                                        )}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>

                        {query.length >= 3 && (
                            <CommandGroup heading="Entrada Manual">
                                <CommandItem
                                    onSelect={() => {
                                        let city = "";
                                        if (query.includes(',')) {
                                            city = query.split(',').pop()?.trim() || "";
                                        }
                                        onChange(query);
                                        if (onSelectAddress) onSelectAddress({ fullAddress: query, city });
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-2 py-3 px-4 aria-selected:bg-blue-500/10 cursor-pointer text-blue-400 font-bold"
                                >
                                    <Plus className="w-3 h-3 shrink-0" />
                                    <span>Usar: "{query}"</span>
                                </CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                    <div className="bg-slate-950/50 p-2 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">Búsqueda Táctica via OSM</span>
                        <div className="flex items-center gap-1 opacity-30 grayscale saturate-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        </div>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
