import { TournamentScope, OfficializationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Server action handling approval/rejection natively
async function updateOfficialStatus(formData: FormData) {
    "use server";
    const tournamentId = formData.get("tournamentId") as string;
    const actionType = formData.get("actionType") as string;
    
    if (!tournamentId) return;

    const newStatus = actionType === "APPROVE" ? "APPROVED" : "REJECTED";

    await prisma.tournament.update({
        where: { id: tournamentId },
        data: { officializationStatus: newStatus }
    });

    revalidatePath("/admin/homologations");
}

export default async function HomologationsDashboard() {
    // Buscar todos los torneos que aspiran a ser National (o Club homologado)
    const pendingTournaments = await prisma.tournament.findMany({
        where: {
            officializationStatus: "PENDING",
            status: "FINISHED" // Idealmente se auditan tras terminar
        },
        include: {
            hostClub: true,
            _count: {
                select: { matches: true, registrations: true }
            }
        },
        orderBy: { updatedAt: "desc" }
    });

    const approvedTournaments = await prisma.tournament.findMany({
        where: { officializationStatus: "APPROVED" },
        take: 5,
        orderBy: { updatedAt: "desc" }
    });

    return (
        <main className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 flex items-end justify-between border-b pb-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Homologaciones</h1>
                        <p className="text-slate-500 font-medium">Tribunal Técnico - Federación Nacional</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Lista Principal de PENDIENTES */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-700">
                            <span className="bg-amber-100 p-1.5 rounded-full"><svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>
                            Escritorio de Auditoría ({pendingTournaments.length} Pendientes)
                        </h2>

                        {pendingTournaments.length === 0 ? (
                            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
                                No hay torneos esperando revisión técnica. El Ranking vive libre de dependencias.
                            </div>
                        ) : (
                            pendingTournaments.map((t) => (
                                <div key={t.id} className="bg-white border rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800">{t.name}</h3>
                                            <p className="text-sm font-medium text-slate-500 uppercase flex items-center gap-2 mt-1">
                                                <span>Sede: {t.hostClub?.name || 'Central'}</span>
                                                <span>•</span>
                                                <span>Disciplina: {t.discipline} / {t.category}</span>
                                            </p>
                                        </div>
                                        <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
                                            {t.scope}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border">
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Matrícula</div>
                                            <div className="text-lg font-black text-slate-700">{t._count.registrations} Jug.</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Partidos Log.</div>
                                            <div className="text-lg font-black text-slate-700">{t._count.matches} Matches</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Inyección Puntos</div>
                                            <div className="text-lg font-black text-emerald-600">MASIVA</div>
                                        </div>
                                    </div>

                                    <form action={updateOfficialStatus} className="flex gap-4 border-t pt-4">
                                        <input type="hidden" name="tournamentId" value={t.id} />
                                        <button type="submit" name="actionType" value="REJECT" className="flex-1 bg-white border-2 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold py-2.5 rounded-lg transition-colors">
                                            Denegar Validéz
                                        </button>
                                        <button type="submit" name="actionType" value="APPROVE" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow font-bold tracking-wide py-2.5 rounded-lg transition-colors">
                                            Certificar (Autorizar Ranking)
                                        </button>
                                    </form>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Historial APROBADOS reciente */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border rounded-xl shadow-sm p-6 sticky top-8">
                            <h2 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
                                <span className="bg-emerald-100 p-1.5 rounded-full"><svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>
                                Actividad Registral
                            </h2>
                            <div className="space-y-4">
                                {approvedTournaments.map(t => (
                                    <div key={t.id} className="border-b last:border-0 pb-3 last:pb-0">
                                        <h4 className="font-bold text-slate-700 text-sm">{t.name}</h4>
                                        <p className="text-xs text-emerald-600 font-semibold mt-1">Status: Homologado</p>
                                    </div>
                                ))}
                                {approvedTournaments.length === 0 && <p className="text-sm text-slate-500">Ningún torneo reciente homologado hacia el Ranking Nacional.</p>}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
