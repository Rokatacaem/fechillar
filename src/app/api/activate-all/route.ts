import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        console.log("Iniciando activación masiva de cuentas...");

        // Buscar todos los perfiles de jugador que NO tienen cuenta (userId nulo) 
        // y que pertenecen a algún club (tenantId no nulo).
        const playersToActivate = await prisma.playerProfile.findMany({
            where: {
                userId: null,
                tenantId: { not: null },
                // Ignoramos el club virtual de libres
                club: { slug: { not: "sgf-federacion-libres" } },
                // Ignoramos perfiles fantasma borrados lógicamente
                slug: { not: { startsWith: 'del-' } }
            },
            include: { club: true }
        });

        if (playersToActivate.length === 0) {
            return NextResponse.json({ message: "No hay jugadores elegibles para activar." });
        }

        const defaultPassword = "Password123!"; // Contraseña estándar genérica
        let activatedCount = 0;
        let errors = [];

        for (const player of playersToActivate) {
            try {
                // Generar un email seguro en caso de que no tenga uno registrado
                const emailToUse = player.email 
                    ? player.email.toLowerCase().trim() 
                    : `${player.slug}@fechillar.cl`;

                // Verificar que el correo no esté ya en uso por otro User
                const existingUser = await prisma.user.findUnique({
                    where: { email: emailToUse }
                });

                if (existingUser) {
                    errors.push(`El correo ${emailToUse} ya está en uso. Saltando a ${player.firstName}.`);
                    continue;
                }

                await prisma.$transaction(async (tx) => {
                    const user = await tx.user.create({
                        data: {
                            email: emailToUse,
                            name: `${player.firstName} ${player.lastName}`.trim(),
                            role: "PLAYER",
                            passwordHash: defaultPassword // Asignación directa
                        }
                    });

                    await tx.playerProfile.update({
                        where: { id: player.id },
                        data: { userId: user.id }
                    });
                });

                activatedCount++;
            } catch (err: any) {
                errors.push(`Error con ${player.firstName}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Activación Masiva Completada`,
            totalActivated: activatedCount,
            defaultPassword,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
