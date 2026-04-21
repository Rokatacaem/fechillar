import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function ClubDashboard({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const resolvedParams = await params;
    const clubId = resolvedParams.id;

    // Obtener miembros del club y solicitudes
    const club = await prisma.club.findUnique({
        where: { id: clubId },
        include: {
            players: true,
            workflowReqs: {
                include: { requester: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!club) return <div>Club no encontrado.</div>;

    const pendingRequests = club.workflowReqs.filter(r => r.status === "PENDING");
    const historicalRequests = club.workflowReqs.filter(r => r.status !== "PENDING");

    return (
        <main className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                
                <header className="border-b border-slate-200 pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Despacho de Sede</h1>
                        <p className="text-slate-500 font-medium text-lg">{club.name}</p>
                    </div>
                    <div>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors">
                            + Crear Torneo de Sede (CLUB)
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Miembros */}
                    <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                           Nómina Activa <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">{club.players.length}</span>
                        </h2>
                        <ul className="space-y-4">
                            {club.players.map(p => (
                                <li key={p.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="font-bold text-slate-700">{p.slug.toUpperCase()}</span>
                                    <span className="text-emerald-600 font-medium text-sm">HCP {p.federationId || 'TBD'}</span>
                                </li>
                            ))}
                            {club.players.length === 0 && <p className="text-sm text-slate-500">Sin jugadores enrolados.</p>}
                        </ul>
                    </div>

                    {/* Workflows */}
                    <div className="md:col-span-2 space-y-6">
                        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-amber-700 mb-6 flex items-center gap-2">
                                Bandeja de Autorización Local
                            </h2>
                            {pendingRequests.length === 0 ? (
                                <p className="text-slate-500 text-sm">No hay trámites en espera de su firma, presidente.</p>
                            ) : (
                                <div className="space-y-4">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="border border-amber-200 bg-amber-50 p-4 rounded-xl flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-amber-900">{req.type === 'CERTIFICATE' ? 'Certificado de Ausencia' : 'Matrícula Oficial'}</div>
                                                <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 mt-1">Solicita: {req.requester.name || 'Jugador'}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="bg-white border border-rose-200 text-rose-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-rose-50">Denegar</button>
                                                <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-500">Firmar y Escalar (Fed)</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                             <h2 className="text-lg font-bold text-slate-700 mb-4">Trámites Históricos</h2>
                             <div className="space-y-2">
                                 {historicalRequests.slice(0, 5).map(req => (
                                     <div key={req.id} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                                         <span className="text-slate-600">{req.type} - {req.requester.name}</span>
                                         <span className="font-bold text-slate-400">{req.status}</span>
                                     </div>
                                 ))}
                             </div>
                        </section>
                    </div>
                </div>

            </div>
        </main>
    );
}
