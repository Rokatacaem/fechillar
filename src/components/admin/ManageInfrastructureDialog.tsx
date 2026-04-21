"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trophy, Save, Loader2 } from "lucide-react";
import { updateInfrastructure } from "@/app/admin/clubes/actions";
import { toast } from "sonner";

const TABLE_TYPES = ["Billar", "Pool Chile", "Bola 9", "Snoker", "Heyball"] as const;

interface TableEntry {
    type: string;
    count: number;
}

interface Props {
    clubId: string;
    initialTables?: TableEntry[];
}

export function ManageInfrastructureDialog({ clubId, initialTables = [] }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tables, setTables] = useState<TableEntry[]>(
        initialTables.length > 0 ? initialTables : [{ type: "Billar", count: 1 }]
    );

    const handleAddType = () => {
        setTables([...tables, { type: "Billar", count: 1 }]);
    };

    const handleRemoveType = (index: number) => {
        setTables(tables.filter((_, i) => i !== index));
    };

    const updateTable = (index: number, field: keyof TableEntry, value: any) => {
        const newTables = [...tables];
        newTables[index] = { ...newTables[index], [field]: value };
        setTables(newTables);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await updateInfrastructure(clubId, tables);
            if (result.success) {
                toast.success("Infraestructura actualizada");
                setOpen(false);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                render={
                    <Button 
                        className="h-10 border-dashed border bg-slate-950/40 hover:bg-slate-900/60 text-slate-400 hover:text-slate-100 text-[9px] font-black uppercase tracking-widest px-4 rounded-xl transition-all border-slate-700 shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        Declaración
                    </Button>
                }
            />
            <DialogContent className="bg-[#0c1220] border-slate-800 text-white max-w-md rounded-[32px] p-8 shadow-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 italic">
                        <Trophy className="w-6 h-6 text-blue-500" />
                        Equipamiento de Sala
                    </DialogTitle>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">
                        Inventario oficial de mesas por disciplina
                    </p>
                </DialogHeader>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {tables.map((table, index) => (
                        <div key={index} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-4 relative group">
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Tipo de Mesa</label>
                                <select 
                                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                    value={table.type}
                                    onChange={(e) => updateTable(index, 'type', e.target.value)}
                                >
                                    {TABLE_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Cantidad</label>
                                <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-lg hover:bg-slate-800"
                                        onClick={() => updateTable(index, 'count', Math.max(1, table.count - 1))}
                                    >
                                        <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="text-sm font-black w-8 text-center">{table.count}</span>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-lg hover:bg-slate-800"
                                        onClick={() => updateTable(index, 'count', table.count + 1)}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            {tables.length > 1 && (
                                <button 
                                    onClick={() => handleRemoveType(index)}
                                    className="absolute -top-2 -right-2 bg-red-500/10 border border-red-500/20 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-6 space-y-3">
                    <Button 
                        variant="link" 
                        onClick={handleAddType}
                        className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:no-underline p-0 flex items-center gap-2"
                    >
                        <Plus className="w-3 h-3" />
                        Añadir otro tipo de mesa
                    </Button>
                    
                    <Button 
                        disabled={loading}
                        onClick={handleSave}
                        className="w-full py-7 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <Save className="w-5 h-5 mr-3" />
                                Guardar Inventario
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
