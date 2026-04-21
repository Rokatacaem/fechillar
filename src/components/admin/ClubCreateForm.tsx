"use client";

import { useState, useEffect } from "react";
import { Building2, Globe, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClub, validateSlug } from "@/app/admin/clubes/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AddressSearch } from "./AddressSearch";
import { cn } from "@/lib/utils";

interface ClubCreateFormProps {
    onSuccess?: () => void;
}

export function ClubCreateForm({ onSuccess }: ClubCreateFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [foundedDate, setFoundedDate] = useState("");
    const [tablesCount, setTablesCount] = useState<number>(0);
    const [slug, setSlug] = useState("");
    const [isValidatingSlug, setIsValidatingSlug] = useState(false);
    const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
    const router = useRouter();

    const handleNameChange = (val: string) => {
        setName(val);
        setSlug(val.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '')
        );
        setIsSlugAvailable(null);
    };

    useEffect(() => {
        if (!slug || slug.length < 3) {
            setIsSlugAvailable(null);
            return;
        }
        const timer = setTimeout(async () => {
            setIsValidatingSlug(true);
            try {
                const { available } = await validateSlug(slug);
                setIsSlugAvailable(available);
            } catch (err) {
                console.error("Error validando slug:", err);
            } finally {
                setIsValidatingSlug(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !slug) {
            toast.error("Nombre y Slug son obligatorios");
            return;
        }

        setIsLoading(true);
        try {
            const result = await createClub({ 
                name, 
                slug, 
                city, 
                address, 
                foundedDate: foundedDate || undefined, 
                tablesCount 
            });
            if (result.success) {
                toast.success("Sede registrada con éxito");
                if (onSuccess) onSuccess();
                router.push(`/admin/clubes/${result.clubId}`);
            } else {
                toast.error(result.error || "Error al crear la sede");
            }
        } catch (error) {
            toast.error("Fallo crítico en la comunicación con el servidor");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre Oficial del Club</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <Input 
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Ej: Club de Billar Santiago"
                            className="bg-slate-950 border-slate-800 focus:border-blue-500/50 pl-10 py-6 text-sm text-white"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fecha de Fundación</label>
                        <Input 
                            type="date"
                            value={foundedDate}
                            onChange={(e) => setFoundedDate(e.target.value)}
                            className="bg-slate-950 border-slate-800 focus:border-blue-500/50 py-6 text-xs text-slate-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mesas (Gran Match)</label>
                        <Input 
                            type="number"
                            min="0"
                            value={tablesCount}
                            onChange={(e) => setTablesCount(parseInt(e.target.value) || 0)}
                            className="bg-slate-950 border-slate-800 focus:border-blue-500/50 py-6 text-xs text-center font-bold text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ubicación / Dirección en Chile</label>
                    <AddressSearch 
                        value={address}
                        onChange={setAddress}
                        onSelectAddress={(details) => {
                            setCity(details.city || "");
                            setAddress(details.fullAddress);
                        }}
                        placeholder="Ej: San Diego 1414, Santiago..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Slug Táctico (URL)</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <Input 
                            value={slug}
                            onChange={(e) => {
                                setSlug(e.target.value);
                                setIsSlugAvailable(null);
                            }}
                            placeholder="ej-club-santiago"
                            className={cn(
                                "bg-slate-950 border-slate-800 focus:border-blue-500/50 pl-10 font-mono text-xs py-6 transition-colors",
                                isSlugAvailable === true && "border-emerald-500/50 text-emerald-400 font-bold",
                                isSlugAvailable === false && "border-red-500/50 text-red-400 font-bold",
                                isSlugAvailable === null && "text-slate-400"
                            )}
                            required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {isValidatingSlug && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
                            {isSlugAvailable === true && <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in" />}
                            {isSlugAvailable === false && <AlertCircle className="w-4 h-4 text-red-500 animate-in zoom-in" />}
                        </div>
                    </div>
                </div>
            </div>

            <Button 
                type="submit" 
                disabled={isLoading || isSlugAvailable === false || isValidatingSlug}
                className={cn(
                    "w-full font-black uppercase tracking-widest text-[11px] py-7 rounded-2xl transition-all shadow-xl",
                    isSlugAvailable === false ? "bg-slate-800 text-slate-500" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
                )}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Validando y Guardando...
                    </>
                ) : (
                    "Registrar en Padrón Nacional"
                )}
            </Button>
        </form>
    );
}
