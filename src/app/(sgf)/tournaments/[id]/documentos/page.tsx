import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FileText, Download, FileSpreadsheet, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function TournamentDocumentsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { hostClub: true },
    });

    if (!tournament) {
        notFound();
    }

    const isHandicap = tournament.modality === "HANDICAP";

    return (
        <div className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <Link
                        href="/tournaments"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors text-xs font-black uppercase tracking-widest"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Volver a Torneos
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">
                            Documentos del <span className="text-emerald-500">Torneo</span>
                        </h1>
                        <p className="text-slate-400 font-medium">{tournament.name}</p>
                    </div>
                </div>

                {/* Grid de documentos */}
                <div className="grid gap-6">
                    {/* Bases del Torneo */}
                    <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-8 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
                            <div className="flex gap-6">
                                <div className="rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20">
                                    <FileText className="h-8 w-8 text-emerald-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                                        Bases del Torneo
                                    </h3>
                                    <p className="text-slate-400 text-sm max-w-md">
                                        Documento oficial con reglamento, formato de juego, premiación y
                                        datos de inscripción para jugadores.
                                    </p>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 pt-2">
                                        <span className="px-2 py-0.5 bg-slate-800 rounded">PDF</span>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                        <span className="text-emerald-500/70">{isHandicap ? 'Con Handicap' : 'Sin Handicap'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <a 
                                href={`/api/tournaments/${tournament.id}/documents/bases`}
                                target="_blank"
                                download
                                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
                            >
                                <Download className="h-4 w-4" />
                                Descargar PDF
                            </a>
                        </div>
                    </div>

                    {/* Planillas de Partidos */}
                    <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-8 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
                            <div className="flex gap-6">
                                <div className="rounded-2xl bg-blue-500/10 p-4 border border-blue-500/20">
                                    <FileSpreadsheet className="h-8 w-8 text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                                        Planillas de Grupos
                                    </h3>
                                    <p className="text-slate-400 text-sm max-w-md">
                                        Planillas de control pre-llenadas con nombres de jugadores para
                                        la mesa de control.
                                    </p>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 pt-2">
                                        <span className="px-2 py-0.5 bg-slate-800 rounded">PDF</span>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                        <span>35 entradas por planilla</span>
                                    </div>
                                </div>
                            </div>
                            
                            {tournament.status === 'DRAFT' ? (
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <div className="px-8 py-4 rounded-xl bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest opacity-50 cursor-not-allowed border border-white/5">
                                        Bloqueado (DRAFT)
                                    </div>
                                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                        Requiere grupos creados
                                    </span>
                                </div>
                            ) : (
                                <a 
                                    href={`/api/tournaments/${tournament.id}/documents/sheets?phaseId=groups`}
                                    download
                                    className="flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 shrink-0"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar PDF
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Nota informativa */}
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                            <span className="text-lg">💡</span>
                        </div>
                        <p className="text-xs text-amber-500 font-medium leading-relaxed">
                            <strong>Nota:</strong> Los documentos se generan en tiempo real con la configuración actual. 
                            Asegúrate de que los premios y bancos estén configurados antes de emitir las Bases Oficiales.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
