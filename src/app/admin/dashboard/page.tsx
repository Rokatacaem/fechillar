import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WarRoomSessionWidget } from "@/components/admin/WarRoomSessionWidget";
import { PurificationTrigger } from "@/components/admin/PurificationTrigger";
import { Toaster } from "sonner";

export default async function SuperAdminWarRoom() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    
    const role = (session?.user as any)?.role as string;
    const name = session?.user?.name || "Operador";
    if (role !== "SUPERADMIN" && role !== "FEDERATION_ADMIN") redirect('/dashboard');

    // QUERIES MÍNIMAS — Objetivo: <1s total para no agotar el pool prisma_migration
    const playerCount = await prisma.playerProfile.count();
    const clubCount = await prisma.club.count();
    const tournamentCount = await prisma.tournament.count();
    const stuckRequestsCount = await prisma.workflowRequest.count({ where: { status: "PENDING" } });
    const auditLogs = await prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, action: true, details: true, createdAt: true, userId: true }
    });
    
    // Detección de Purificación
    const isPurified = auditLogs.length === 1 && auditLogs[0].action === "ENTORNO_PURIFICADO_SGF";
    const isSystemEmpty = playerCount === 0 && clubCount === 0 && tournamentCount === 0;

    return (
        <main className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-sans">
            <Toaster position="top-right" theme="dark" richColors />
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                <header className="flex justify-between items-end border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow">WAR ROOM <span className="text-rose-600">V1.0</span></h1>
                        <p className="text-slate-400 font-medium tracking-tight">Satélite de Supervisión Nacional de la Federación</p>
                        
                        {(isPurified || isSystemEmpty) && (
                            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-emerald-400 font-black text-xs uppercase tracking-widest animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Entorno Purificado: Listo para Carga Oficial de Clubes
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {!isSystemEmpty && <PurificationTrigger />}
                        <WarRoomSessionWidget name={name} role={role} />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* CONTADORES GLOBALES */}
                    <div className="lg:col-span-1 space-y-4">
                        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 border-b border-slate-800 pb-2">Telemetría Federada</h2>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Jugadores Registrados</span>
                                    <span className="text-3xl font-black text-emerald-400">{playerCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Clubes Firmados</span>
                                    <span className="text-3xl font-black text-emerald-400">{clubCount}</span>
                                </div>
                                <a href="/tournaments" className="flex justify-between items-center group">
                                    <span className="text-slate-400 text-sm group-hover:text-indigo-400 transition-colors">Torneos Registrados</span>
                                    <span className="text-3xl font-black text-indigo-400 group-hover:scale-110 transition-transform">{tournamentCount}</span>
                                </a>
                                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                                    <span className="text-amber-400 text-sm font-bold">Trámites Pendientes</span>
                                    <span className={`text-2xl font-black ${stuckRequestsCount > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{stuckRequestsCount}</span>
                                </div>
                            </div>
                        </section>

                        {/* ACCIONES RÁPIDAS */}
                        <section className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 p-6 rounded-2xl shadow-xl">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Acciones del Comandante</h2>
                            <div className="space-y-3">
                                <a href="/admin/census" className="block w-full bg-slate-950 border border-slate-800 text-slate-300 py-3 rounded-xl font-bold text-sm text-center hover:border-indigo-500 hover:text-white transition-all">
                                    Padrón Nacional →
                                </a>
                                <a href="/tournaments" className="block w-full bg-slate-950 border border-slate-800 text-indigo-400 py-3 rounded-xl font-black text-sm text-center hover:bg-indigo-500 hover:text-white transition-all">
                                    Gestión de Torneos →
                                </a>
                                <a href="/tournaments/nuevo" className="block w-full bg-slate-950 border border-slate-800 text-slate-300 py-3 rounded-xl font-bold text-sm text-center hover:border-emerald-500 hover:text-white transition-all">
                                    Nuevo Torneo →
                                </a>
                                <a href="/admin/clubes" className="block w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-sm text-center shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all">
                                    Gestión de Clubes →
                                </a>
                            </div>
                        </section>
                    </div>

                    {/* AUDIT LOG TERMINAL */}
                    <div className="lg:col-span-2">
                        <section className="bg-[#0b1120] border border-slate-800 p-6 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden min-h-[500px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-rose-500 to-indigo-500"></div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex justify-between">
                                <span>TERMINAL DE AUDITORÍA</span>
                                <span className="text-emerald-500">● Online</span>
                            </h2>
                            
                            <div className="flex-1 overflow-y-auto font-mono text-sm space-y-2 pr-2">
                                {auditLogs.length === 0 ? (
                                    <p className="text-slate-600 italic text-xs">Sin registros de auditoría aún.</p>
                                ) : auditLogs.map(log => (
                                    <div key={log.id} className="group flex gap-3 border-l-2 border-slate-800 pl-3 py-1.5 hover:border-emerald-500/50 transition-colors">
                                        <span className="text-slate-600 text-[10px] shrink-0 font-bold pt-0.5">
                                            {String(log.createdAt.getHours()).padStart(2,'0')}:{String(log.createdAt.getMinutes()).padStart(2,'0')}
                                        </span>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-emerald-400 font-bold text-[11px] uppercase tracking-wider">{log.action}</span>
                                            {log.details && (
                                                <p className="text-slate-500 text-[10px] break-all font-mono">
                                                    {log.details.substring(0, 120)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800/50">
                                <p className="text-[9px] text-slate-700 font-medium text-center uppercase tracking-widest">
                                    Acceso monitoreado · Ley de protección de datos personales
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
