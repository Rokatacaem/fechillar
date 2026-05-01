import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPlayerStanding } from "@/lib/standing";
import DelegateInscriptionsUI from "./DelegateInscriptionsUI";

const prisma = new PrismaClient();

export default async function DelegateInscriptionsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session?.user?.id as string }
    });

    if (!user?.managedClubId) {
        return (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-rose-500">Acceso Denegado</h1>
                <p className="text-slate-400">No tienes una Sede asignada bajo tu mando.</p>
            </div>
        );
    }

    // 1. Obtener jugadores vinculados al club del delegado
    const players = await prisma.playerProfile.findMany({
        where: { tenantId: user.managedClubId },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            },
            registrations: {
                include: {
                    tournament: { select: { name: true } }
                }
            }
        }
    });

    // 2. Calcular standing para cada jugador
    const playersWithStanding = await Promise.all(players.map(async (p) => {
        const standing = await getPlayerStanding(p.userId as string);

        // Obtener membresía actual para facilitar el ID al modal
        const membership = await prisma.membership.findFirst({
            where: { userId: p.userId as string }, // ✅ ¡AQUÍ ESTÁ EL FIX APLICADO!
            orderBy: { validUntil: "desc" },
            select: { id: true, status: true }
        });

        return {
            ...p,
            standing,
            membershipId: membership?.id,
            membershipStatus: membership?.status
        };
    }));

    return (
        <main className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-white tracking-tight">GESTIÓN DE INSCRIPCIONES</h1>
                <p className="text-slate-400">Panel Táctico para Delegados de Sede</p>
            </header>

            <DelegateInscriptionsUI players={playersWithStanding} />
        </main>
    );
}