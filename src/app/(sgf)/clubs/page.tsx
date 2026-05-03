import Link from "next/link";
import prisma from "@/lib/prisma";
import { Shield, MapPin, Users, ChevronRight, Activity, Plus } from "lucide-react";
import { parseLegalStatus } from "@/lib/utils";
import { isAfter } from "date-fns";
import { BulkImportTool } from "@/components/admin/BulkImportTool";
import { DeleteClubButton } from "@/components/admin/DeleteClubButton";
import { auth } from "@/auth";

export default async function ClubsPage() {
    const session = await auth();
    const isAdmin = ["SUPERADMIN", "FEDERATION_ADMIN"].includes((session?.user as any)?.role);

    let clubs: any[] = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            clubs = await prisma.club.findMany({
                orderBy: { name: 'asc' },
                include: {
                    _count: { select: { players: true } }
                }
            });
            break;
        } catch (error: any) {
            attempts++;
            if (attempts >= maxAttempts) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    const now = new Date();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Gestión de Clubes</h1>
                    <p className="text-slate-400 mt-1 uppercase tracking-widest text-[10px] font-bold">Base de Datos Federativa Oficial</p>
                </div>
                <div className="flex items-center gap-3">
                    <BulkImportTool />
                    <Link 
                        href="/admin/clubes/nuevo" 
                        className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                        <Plus className="w-4 h-4" />
                        Registrar Nuevo Club
                    </Link>
                </div>
            </div>

            {/* Empty State vs Clubs Grid */}
            {clubs.length === 0 ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] p-12 text-center group hover:border-emerald-500/20 transition-colors">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Shield className="w-8 h-8 text-slate-700" />
                    </div>
                    <h2 className="text-white font-bold text-lg">No hay clubes registrados</h2>
                    <p className="text-slate-500 text-sm max-w-sm mt-2">
                        El entorno ha sido purificado. Utiliza el botón superior para iniciar la carga oficial de entidades federadas.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubs.map((club) => {
                        const compliance = parseLegalStatus(club.legalStatus);
                        
                        const isValidDate = (d: string) => d && !isNaN(new Date(d).getTime());
                        
                        const isVigente = isValidDate(compliance.expiryDate) 
                            ? isAfter(new Date(compliance.expiryDate), now) 
                            : false;
                            
                        const isDeferred = isValidDate(compliance.deferredUntil) 
                            ? isAfter(new Date(compliance.deferredUntil), now) 
                            : false;
                        
                        let statusText = "S/N";
                        let statusColor = "text-slate-500";

                        if (isVigente) {
                            statusText = "VIGENTE";
                            statusColor = "text-emerald-400";
                        } else if (isDeferred) {
                            statusText = "PRORROGADO";
                            statusColor = "text-amber-500";
                        } else if (isValidDate(compliance.expiryDate) || isValidDate(compliance.deferredUntil)) {
                            statusText = "EXPIRADO";
                            statusColor = "text-red-500";
                        }

                        return (
                            <div 
                                key={club.id} 
                                className="group relative bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
                            >
                                {!club.isValidated && (
                                    <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-500/20 uppercase tracking-widest animate-pulse">
                                        Pendiente
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform border border-white/5">
                                        {club.logoUrl ? (
                                            <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover rounded-2xl" />
                                        ) : "🎱"}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">{club.name}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {club.city || 'Ubicación Pendiente'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-emerald-500" />
                                            <span className="text-sm font-medium text-slate-300">Estado Legal</span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-emerald-500" />
                                            <span className="text-sm font-medium text-slate-300">Vigencia</span>
                                        </div>
                                        <span className={club.isValidated ? 'text-emerald-400 text-xs font-bold' : 'text-amber-500 text-xs font-bold'}>
                                            {club.isValidated ? 'ACTIVO' : 'PENDIENTE'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
                                    <Link 
                                        href={`/admin/clubes/${club.id}`}
                                        className="flex-1 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2 border border-white/5 group/btn"
                                    >
                                        Gestionar Entidad
                                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                    {isAdmin && (
                                        <DeleteClubButton
                                            clubId={club.id}
                                            clubName={club.name}
                                            playerCount={club._count?.players ?? 0}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
