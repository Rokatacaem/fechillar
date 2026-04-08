import Link from "next/link";
import { Shield, MapPin, Users, ChevronRight, Activity } from "lucide-react";

export default function ClubsPage() {
    const clubs = [
        { id: 1, name: "Club Billar Santiago", city: "Santiago", members: 45, status: "Activo" },
        { id: 2, name: "Club Temuco", city: "Temuco", members: 28, status: "Activo" },
        { id: 3, name: "Club Copiapó", city: "Copiapó", members: 0, status: "Pendiente" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Gestión de Clubes</h1>
                    <p className="text-slate-400 mt-1">Administra las entidades federadas y sus estados de membresía.</p>
                </div>
                <button className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all font-bold text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Registrar Nuevo Club
                </button>
            </div>

            {/* Clubs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                    <div 
                        key={club.id} 
                        className="group relative bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
                    >
                        {club.status === 'Pendiente' && (
                            <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-500/20 uppercase tracking-widest animate-pulse">
                                Pendiente
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                🎱
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">{club.name}</h3>
                                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {club.city}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-medium text-slate-300">Miembros</span>
                                </div>
                                <span className="text-sm font-bold text-white">{club.members}</span>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-medium text-slate-300">Vigencia</span>
                                </div>
                                <span className={club.status === 'Activo' ? 'text-emerald-400 text-xs font-bold' : 'text-amber-500 text-xs font-bold'}>
                                    {club.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5">
                            {club.status === 'Pendiente' ? (
                                <button className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors text-sm">
                                    Validar Registro
                                </button>
                            ) : (
                                <button className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2 border border-white/5 group/btn">
                                    Gestionar Entidad
                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
