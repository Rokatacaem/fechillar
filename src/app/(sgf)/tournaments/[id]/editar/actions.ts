"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateTournament(tournamentId: string, formData: FormData) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!["SUPERADMIN", "FEDERATION_ADMIN"].includes(role)) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const name        = formData.get("name") as string;
        const description = formData.get("description") as string | null;
        const location    = formData.get("location") as string | null;
        const startDate   = formData.get("startDate") as string;
        const endDate     = formData.get("endDate") as string | null;
        const status      = formData.get("status") as string;
        const scope       = formData.get("scope") as string;
        const tenantId    = (formData.get("tenantId") as string) || null;
        const maxTables   = parseInt(formData.get("maxTables") as string) || 8;
        const hasHandicap = formData.get("hasHandicap") === "on";
        const hasTimeLimit = formData.get("hasTimeLimit") === "on";
        const secondsPerShot = parseInt(formData.get("secondsPerShot") as string) || 40;

        // Config JSON
        const groupSize        = parseInt(formData.get("groupSize") as string) || 4;
        const advancingCount   = parseInt(formData.get("advancingCount") as string) || 2;
        const inningsPerPhase  = parseInt(formData.get("inningsPerPhase") as string) || 30;
        const playerCount      = parseInt(formData.get("playerCount") as string) || 32;

        const config = {
            groups: { size: groupSize, advance: advancingCount },
            inningsPerPhase,
            playerCount,
            hasHandicap,
        };

        await prisma.tournament.update({
            where: { id: tournamentId },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                location: location?.trim() || null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                status: status as any,
                scope: scope as any,
                tenantId: tenantId || null,
                maxTables,
                hasTimeLimit,
                secondsPerShot,
                config,
            }
        });

        revalidatePath("/tournaments");
        revalidatePath(`/tournaments/${tournamentId}/editar`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getAllClubs() {
    return prisma.club.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    });
}
