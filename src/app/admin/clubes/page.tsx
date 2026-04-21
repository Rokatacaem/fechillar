import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronRight, Users, Trophy, ShieldCheck, Plus } from "lucide-react";
import { CreateClubDialog } from "@/components/admin/CreateClubDialog";
import { DeleteClubButton } from "@/components/admin/DeleteClubButton";

export default async function AdminClubsList() {
    const session = await auth();
    if (!session || !["SUPERADMIN", "FEDERATION_ADMIN"].includes((session.user as any).role)) {
        redirect('/login');
    }

    const clubs = await prisma.club.findMany({
        include: {
            _count: {
                select: {
                    players: true,
                    hostedTournaments: true,
                    delegates: true
                }
            }
        },
        orderBy: { name: "asc" }
    });

    return (
        <main className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8">
                
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800 pb-8">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight uppercase">
                            Inventario de <span className="text-blue-500">Sedes Federadas</span>
                        </h1>
                        <p className="text-slate-500 font-mono text-xs mt-2 tracking-widest uppercase flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            Gestión de activos físicos y autoridades regionales
                        </p>
                    </div>

                    <CreateClubDialog />
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubs.map((club) => (
                        <Link 
                            key={club.id} 
                            href={`/admin/clubes/${club.id}`}
                            className="group block bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:bg-slate-900 hover:border-blue-500/50 transition-all shadow-xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-blue-500/30 transition-colors">
                                    {club.logoUrl ? (
                                        <img src={club.logoUrl} alt={club.name} className="w-10 h-10 object-contain" />
                                    ) : (
                                        <Building2 className="w-10 h-10 text-slate-700" />
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                                        club.isValidated ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/30 text-amber-500 bg-amber-500/5'
                                    }`}>
                                        {club.isValidated ? 'Validado' : 'Pendiente'}
                                    </span>
                                    <DeleteClubButton clubId={club.id} clubName={club.name} />
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors uppercase truncate">
                                {club.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-mono mb-6 truncate">
                                {club.city || (club.address?.includes(',') ? club.address.split(',').pop()?.trim() : 'Ciudad No Registrada')}
                            </p>

                            <div className="grid grid-cols-3 gap-2 border-t border-slate-800/50 pt-4 mt-auto">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mb-1">Delegados</p>
                                    <div className="flex justify-center items-center gap-1 text-blue-400 font-bold">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>{club._count.delegates}</span>
                                    </div>
                                </div>
                                <div className="text-center border-x border-slate-800/50">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mb-1">Jugadores</p>
                                    <div className="flex justify-center items-center gap-1 text-slate-300 font-bold">
                                        <Users className="w-3 h-3" />
                                        <span>{club._count.players}</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mb-1">Torneos</p>
                                    <div className="flex justify-center items-center gap-1 text-slate-300 font-bold">
                                        <Trophy className="w-3 h-3" />
                                        <span>{club._count.hostedTournaments}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                                Acceder a Ficha Maestra
                                <ChevronRight className="w-3 h-3 ml-1" />
                            </div>
                        </Link>
                    ))}

                    {clubs.length === 0 && (
                        <div className="col-span-full p-20 text-center bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-3xl">
                            <Building2 className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                            <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">
                                No hay sedes registradas en el sistema nacional.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
