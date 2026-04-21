import React from "react";
export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import { getPlayerStanding } from "@/lib/standing";
import { QRCodeCanvas } from "@/components/public/QRCodeCanvas";
import { WhiteLabelProvider } from "@/components/public/WhiteLabelProvider";
import { format } from "date-fns";
import { Shield, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { notFound } from "next/navigation";

export default async function PlayerPublicIDPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const player = await prisma.playerProfile.findFirst({
        where: {
            OR: [
                { publicSlug: slug },
                { slug: slug }
            ]
        },
        include: { user: true, club: true }
    });

    if (!player) return notFound();

    const standing = await getPlayerStanding(player.userId);
    
    // Si no hay foto, generamos un color de fondo dinámico basado en la inicial
    const avatarBg = player.user?.name || player.firstName ? `bg-gradient-to-br from-slate-800 to-slate-900` : "bg-slate-900";

    // Mapeo seguro de colores para Tailwind
    const colorMap: Record<string, string> = {
        "emerald-500": "emerald-500",
        "amber-500": "amber-500",
        "rose-600": "rose-600"
    };

    const safeColor = colorMap[standing.color] || "slate-500";

    const statusIcons = {
        GREEN: <CheckCircle className="w-10 h-10 text-emerald-500 print:text-emerald-700" />,
        AMBER: <AlertCircle className="w-10 h-10 text-amber-500 print:text-amber-700" />,
        RED: <XCircle className="w-10 h-10 text-rose-500 print:text-rose-700" />
    };

    return (
        <WhiteLabelProvider 
            brandColor={player.club?.brandColor || "#0ea5e9"} 
            accentColor={player.club?.accentColor || "#10b981"}
        >
            <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden relative">
                {/* Background Effects */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-[380px] relative space-y-6 animate-in fade-in zoom-in-95 duration-700">
                    {/* HEAD: Official Branding */}
                    <div className="text-center space-y-3 mb-4">
                        <img 
                            src="/fechillar_logo_final_v3_transparent.png" 
                            alt="FECHILLAR" 
                            className="h-14 mx-auto drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        />
                        <div className="space-y-1">
                            <h1 className="text-white text-[12px] font-black tracking-[0.3em] uppercase opacity-90">
                                Federación Chilena de Billar
                            </h1>
                            <p className="text-emerald-500/80 text-[10px] font-bold uppercase tracking-[0.5em]">
                                ID Digital Federada
                            </p>
                        </div>
                    </div>

                    {/* CARD: Wallet Style */}
                    <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                        {/* Status Light */}
                        <div className={`absolute top-0 left-0 w-full h-1 bg-${safeColor} opacity-50`} />
                        
                        <div className="p-8 pt-10 space-y-8">
                            {/* Player Photo Section */}
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative">
                                    <div className={`w-36 h-36 rounded-[2.5rem] bg-slate-800 border-2 border-${safeColor}/30 overflow-hidden shadow-2xl`}>
                                        {player.photoUrl ? (
                                            <img src={player.photoUrl} alt={player.user?.name || player.firstName || ""} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white/10 uppercase italic">
                                                {(player.user?.name || player.firstName || "X")[0]}
                                            </div>
                                        )}
                                    </div>
                                    {/* Status Icon */}
                                    <div className="absolute -bottom-2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                        <div className={`bg-#070b14 p-1.5 rounded-2xl border border-white/10 shadow-2xl`}>
                                            {statusIcons[standing.status]}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Text Data Section */}
                            <div className="text-center space-y-2 pt-2">
                                <h2 className="text-white text-2xl font-black tracking-tighter uppercase leading-tight line-clamp-2">
                                    {player.user?.name || (player.firstName ? `${player.firstName} ${player.lastName}` : "SIN NOMBRE")}
                                </h2>
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-slate-400 font-mono text-[10px] tracking-widest">
                                        RUT: <span className="text-white font-bold">{player.rut || '********-*'}</span>
                                    </p>
                                    <div className="flex items-center gap-2 bg-white/5 py-1 px-4 rounded-full border border-white/5 mt-3">
                                        <Shield className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            {player.club?.name || "AGENTE LIBRE"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider with Cutouts */}
                            <div className="flex items-center gap-4 py-2">
                                <div className="h-[1px] flex-1 bg-white/5" />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                <div className="h-[1px] flex-1 bg-white/5" />
                            </div>

                            {/* QR Section (Mobile Optimized) */}
                            <div className="flex flex-col items-center gap-6">
                                <div className="bg-white p-5 rounded-[2.5rem] shadow-white/10 shadow-2xl transition-transform active:scale-95 duration-500">
                                    <QRCodeCanvas value={`https://fechillar.cl/perfil/${slug}`} size={160} />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className={`text-[11px] font-black uppercase tracking-tighter text-${safeColor} animate-pulse`}>
                                        {standing.message}
                                    </p>
                                    <p className="text-slate-500 text-[8px] font-bold uppercase tracking-[0.3em]">
                                        Validación Oficial de Competencia
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Credits */}
                    <div className="text-center opacity-30 text-[8px] font-black text-white uppercase tracking-[0.5em]">
                        SGF • Chile 2025
                    </div>
                </div>
            </div>
        </WhiteLabelProvider>
    );
}
