"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Save, X } from "lucide-react";
import * as XLSX from "xlsx";
import { processBulkImport } from "@/app/admin/clubes/bulk-actions";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function BulkImportTool({ fixedClubId, fixedClubName }: { fixedClubId?: string, fixedClubName?: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileData, setFileData] = useState<any[]>([]);
    const [fileName, setFileName] = useState("");
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            // Mapeo básico basado en la estructura sugerida
            const mappedData = data.map((row: any) => ({
                firstName: row.Nombres || row.Nombre || "",
                lastName: row.Apellidos || row.Apellido || "",
                rut: row.RUT || row.ID || "",
                email: row.Email || row.Correo || "",
                clubName: row.Club || row.Sede || "Federación",
                disciplines: (row.Disciplina || "3 Bandas").split(",").map((d: string) => d.trim()),
                points: parseInt(row["Puntos 2025"]) || 0,
                average: parseFloat(String(row.Promedio || "0").replace(",", ".")) || 0,
                category: row.Categoria || row.Categoría || "PROMO",
                handicap: parseInt(row.Handicap) || 15
            })).filter(p => p.firstName);

            setFileData(mappedData);
        };
        reader.readAsBinaryString(file);
    };

    const handleProcessImport = async () => {
        if (fileData.length === 0) return;
        setLoading(true);
        try {
            const result = await processBulkImport({ players: fileData, fixedClubId });
            if (result.success) {
                // Cast to any to bypass the union type narrowing limitation in this specific context
                const successData = result as any;
                if (successData.errors && successData.errors.length > 0) {
                    setImportErrors(successData.errors);
                    toast.warning(`Importación completada con ${successData.errors.length} errores.`);
                } else {
                    toast.success(`Importación finalizada. ${successData.imported} creados, ${successData.skipped} saltados.`);
                    setOpen(false);
                    setFileData([]);
                    setFileName("");
                    setImportErrors([]);
                }
            } else {
                toast.error((result as any).error || "Ocurrió un error en el servidor");
            }
        } catch (error: any) {
            toast.error(error.message || "Error crítico durante el proceso");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                render={
                    <Button className="border border-slate-700 bg-slate-950/50 hover:bg-slate-900 text-slate-300 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        Herramienta de Importación
                    </Button>
                }
            />
            <DialogContent className="bg-[#0c1220] border-slate-800 text-slate-200 sm:max-w-2xl w-full rounded-[48px] p-0 overflow-hidden shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] border-2">
                <div className="p-10 space-y-8 w-full">
                    {/* Header Personalizado */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-tight italic text-white leading-none">
                                    {fixedClubName || "Padrón del Club"}
                                </h2>
                            </div>
                            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest pl-1">
                                {fixedClubName ? "Carga masiva táctica para este club" : "Ingesta masiva de deportistas federados"}
                            </p>
                        </div>

                        {fileData.length > 0 && (
                            <div className="flex items-center gap-6 pr-2">
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Detectados</p>
                                    <p className="text-2xl font-black text-emerald-400 leading-none">
                                        {fileData.length < 10 ? `0${fileData.length}` : fileData.length}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => { setFileData([]); setFileName(""); }} 
                                    className="p-2 hover:bg-red-500/10 text-slate-700 hover:text-red-400 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Contenido Principal */}
                    <div className="min-h-[300px]">
                        {fileData.length === 0 ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative border border-dashed border-slate-800 rounded-[40px] p-24 flex flex-col items-center justify-center bg-slate-950/50 hover:bg-slate-900/30 hover:border-emerald-500/40 transition-all duration-500 cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-emerald-500/[0.02] rounded-[40px] group-hover:bg-emerald-500/[0.05] transition-colors" />
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:border-emerald-500/20 transition-all">
                                        <Upload className="w-7 h-7 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                    </div>
                                    <h3 className="text-white font-black uppercase tracking-widest text-[11px]">Soltar Planilla Excel</h3>
                                    <p className="text-slate-500 text-[9px] mt-2 font-mono uppercase tracking-widest opacity-60">O selecciona archivo (xlsx, csv)</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xlsx, .xls, .csv" 
                                    onChange={handleFileUpload} 
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-[32px] border border-slate-800 bg-slate-950/50 overflow-hidden shadow-inner">
                                <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                                    <Table>
                                        <TableHeader className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
                                            <TableRow className="border-slate-800 hover:bg-transparent">
                                                <TableHead className="text-[9px] font-black uppercase text-slate-500 py-4 h-auto">Nombre Deportista</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase text-slate-500 py-4 h-auto text-center">Cat / Ptos</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase text-slate-500 py-4 h-auto text-center">Prom / Hcp</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase text-slate-500 py-4 h-auto text-right">Disciplinas</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fileData.map((row, idx) => (
                                                <TableRow key={idx} className="border-slate-900/50 hover:bg-emerald-500/[0.03] transition-colors leading-none">
                                                    <TableCell className="py-3">
                                                        <p className="text-[11px] font-extrabold text-slate-200 uppercase">{row.firstName} {row.lastName}</p>
                                                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{row.clubName}</p>
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <p className="text-[10px] font-black text-amber-400 uppercase">{row.category}</p>
                                                        <p className="text-[9px] font-mono text-slate-400 mt-0.5">{row.points} pts</p>
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <p className="text-[10px] font-bold text-slate-300">{row.average.toFixed(3)}</p>
                                                        <p className="text-[9px] font-mono text-slate-500 mt-0.5">Hcp {row.handicap}</p>
                                                    </TableCell>
                                                    <TableCell className="text-right py-3">
                                                        <div className="flex justify-end gap-1.5 leading-none">
                                                            {row.disciplines.map((d: string) => (
                                                                <span key={d} className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/10 uppercase font-black tracking-tighter">
                                                                    {d}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                                
                                {importErrors.length > 0 && (
                                    <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-[28px] space-y-3">
                                        <div className="flex items-center gap-2 text-red-400">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Detalle de Errores ({importErrors.length})</span>
                                        </div>
                                        <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-1 pr-2">
                                            {importErrors.map((err, i) => (
                                                <p key={i} className="text-[9px] text-red-500/70 font-mono leading-tight bg-red-500/[0.03] p-2 rounded-lg border border-red-500/[0.05]">
                                                    {err}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer / Acciones */}
                    <div className="flex gap-6 items-stretch pt-2">
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-[28px] p-5 flex items-center gap-5">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-white font-black text-[10px] uppercase tracking-tight block">Nota de Ingesta</span>
                                <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                                    {fixedClubId 
                                        ? `Vinculación automática a ${fixedClubName}. Se omitirá el campo 'Club' del archivo.`
                                        : "Los clubes deben ser exactos a los del sistema. Perfiles sin email marcarán 'Pendiente'."
                                    }
                                </p>
                            </div>
                        </div>
                        
                        <Button 
                            disabled={loading || fileData.length === 0}
                            onClick={handleProcessImport}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest px-14 rounded-[28px] transition-all shadow-2xl shadow-emerald-500/10 disabled:grayscale disabled:opacity-20 flex flex-col gap-0 h-auto py-5"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <Save className="w-5 h-5 mb-1 text-emerald-200" />
                                    <span className="text-[11px]">Confirmar Ingesta</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
