import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * RUTA DE EMERGENCIA: Permite forzar la purga del entorno vía URL directa.
 * Solo accesible por admin@fechillar.cl
 */
export async function GET() {
    const session = await auth();
    const userEmail = session?.user?.email?.toLowerCase();

    if (userEmail !== "admin@fechillar.cl") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    try {
        // LIMPIEZA ATÓMICA VÍA SQL CRUDO (Más agresivo para Windows/Postgres)
        await prisma.$transaction([
            // Limpiar logs primero
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "AuditLog" CASCADE`),
            // Limpiar transacciones y torneos
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "Match" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "TournamentRegistration" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "TournamentEnrollment" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "TournamentAssignment" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "TournamentGroup" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "TournamentPhase" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "TournamentPhoto" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "Tournament" CASCADE`),
            // Limpiar rankings
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "RankingSnapshot" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "Ranking" CASCADE`),
            // Limpiar entidades maestras
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "PlayerProfile" CASCADE`),
            prisma.$executeRawUnsafe(`UPDATE "User" SET "managedClubId" = NULL`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "Club" CASCADE`),
            prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE email != 'admin@fechillar.cl'`),
            // Limpiar solicitudes y otros
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "WorkflowRequest" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "Membership" CASCADE`),
            prisma.$executeRawUnsafe(`TRUNCATE TABLE "FinanceRecord" CASCADE`),
        ]);

        // Invalidador de Caché Maestro
        const { revalidatePath, revalidateTag } = require("next/cache");
        revalidatePath("/", "layout");
        revalidateTag("tournaments");

        return new NextResponse(`
            <html>
                <body style="background: #020617; color: #10b981; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
                    <h1 style="font-size: 3rem;">✅ ENTORNÓ PURIFICADO</h1>
                    <p style="color: #94a3b8;">La base de datos está limpia. El Calendario Nacional ha sido reseteado.</p>
                    <a href="/admin/dashboard" style="margin-top: 20px; color: white; background: #2563eb; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Volver al Dashboard</a>
                </body>
            </html>
        `, { headers: { 'Content-Type': 'text/html' } });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
