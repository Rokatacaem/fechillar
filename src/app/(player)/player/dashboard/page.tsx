import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function PlayerIntranet() {
    const session = await auth();
    if (!session || !session.user) redirect('/login');

    const userId = session.user.id;

    // Extraer trámites del jugador
    const requests = await prisma.workflowRequest.findMany({
        where: { requesterId: userId },
        orderBy: { createdAt: 'desc' }
    });

    const activeReq = requests[0]; // Mostramos el último en el timeline track

    return (
        <main className="min-h-screen bg-slate-950 p-8 font-sans text-slate-200">
            <div className="max-w-5xl mx-auto space-y-10">
                
                <header className="border-b border-slate-800 pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Ventanilla Única</h1>
                        <p className="text-slate-400">Portal de Trámites Fechillar</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Generadores */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-emerald-400 mb-4">Generar Trámite</h2>
                        
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-colors hover:border-slate-700">
                            <h3 className="font-bold text-white mb-2">Solicitar Matrícula a Nacional</h3>
                            <p className="text-sm text-slate-400 mb-4">Permite enviar la inscripción formal al próximo torneo de la Federación. Requiere el VB del presidente de tu club.</p>
                            <button className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold py-3 rounded-xl border border-slate-700 transition">
                                Iniciar Flujo
                            </button>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-colors hover:border-slate-700">
                            <h3 className="font-bold text-white mb-2">Certificado de Ausencia Competitiva</h3>
                            <p className="text-sm text-slate-400 mb-4">Documento firmado por el Tribunal dictaminando que estás citado a un evento oficial regional o nacional.</p>
                            <button className="w-full bg-indigo-900/50 hover:bg-indigo-900 text-indigo-300 font-bold py-3 rounded-xl border border-indigo-800 transition">
                                Solicitar Certificado
                            </button>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                        <h2 className="text-xl font-bold text-white mb-8">Estado de mi trámite actual</h2>
                        
                        {!activeReq ? (
                            <p className="text-slate-500 italic">No tienes trámites en curso.</p>
                        ) : (
                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                                
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 ${activeReq ? 'bg-emerald-500' : 'bg-slate-700'} text-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                                        1
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow bg-slate-800 border border-slate-700">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-slate-200">Enviado</div>
                                        </div>
                                        <div className="text-slate-400 text-sm">Tu solicitud fue registrada en el sistema.</div>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 ${activeReq.status !== 'PENDING' ? 'bg-emerald-500' : 'bg-slate-700'} text-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                                        2
                                    </div>
                                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow border ${activeReq.status !== 'PENDING' ? 'bg-slate-800 border-slate-700' : 'bg-slate-950 border-slate-800 opacity-50'}`}>
                                        <div className="font-bold text-slate-200">Firma Club</div>
                                        <div className="text-slate-400 text-sm">Visto Bueno de tu delegado u organizador.</div>
                                    </div>
                                </div>

                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 ${activeReq.status === 'FEDERATION_APPROVED' ? 'bg-indigo-500' : 'bg-slate-700'} text-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow border ${activeReq.status === 'FEDERATION_APPROVED' ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-slate-950 border-slate-800 opacity-50'}`}>
                                        <div className="font-bold text-slate-200">Resolución Nacional</div>
                                        <div className="text-slate-400 text-sm">Completado.</div>
                                        {activeReq.status === 'FEDERATION_APPROVED' && activeReq.type === 'CERTIFICATE' && (
                                            <button className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded transition">Descargar PDF Oficial</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
