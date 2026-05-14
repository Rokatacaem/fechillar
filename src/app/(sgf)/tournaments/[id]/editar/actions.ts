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
        const name             = formData.get("name") as string;
        const description      = formData.get("description") as string | null;
        const venueAddress     = formData.get("venueAddress") as string | null;
        const venueClubId      = (formData.get("venueClubId") as string) || null;
        const startDate        = formData.get("startDate") as string;
        const endDate          = formData.get("endDate") as string | null;
        const status           = formData.get("status") as string;
        const scope            = formData.get("scope") as string;
        const tenantId         = (formData.get("tenantId") as string) || null;
        const maxTables           = parseInt(formData.get("maxTables") as string) || 8;
        const hasHandicap         = formData.get("hasHandicap") === "on";
        const timeControlMode     = (formData.get("timeControlMode") as string) || "NONE";
        const hasTimeLimit        = timeControlMode !== "NONE";
        const secondsPerShot      = parseInt(formData.get("secondsPerShot") as string) || 40;
        const extensionsPerPlayer = parseInt(formData.get("extensionsPerPlayer") as string) || 2;

        // Config JSON
        const groupFormat      = (formData.get("groupFormat") as string) || "RR_3";
        const advancingCount   = parseInt(formData.get("advancingCount") as string) || 2;
        const inningsPerPhase  = parseInt(formData.get("inningsPerPhase") as string) || 30;
        const playerCount      = parseInt(formData.get("playerCount") as string) || 32;
        const registrationFee  = parseInt(formData.get("registrationFee") as string) || 30000;
        const distanceGroups   = parseInt(formData.get("distanceGroups") as string) || 30;
        const distancePlayoffs = parseInt(formData.get("distancePlayoffs") as string) || 35;
        const distanceFinal    = parseInt(formData.get("distanceFinal") as string) || 35;
        const inningsGroups    = parseInt(formData.get("inningsGroups") as string) || 35;
        const inningsPlayoffs  = parseInt(formData.get("inningsPlayoffs") as string) || 40;
        const tables           = parseInt(formData.get("tables") as string) || 6;
        const turns            = parseInt(formData.get("turns") as string) || 3;
        const bracketSize      = parseInt(formData.get("bracketSize") as string) || 16;
        const bankAccountName  = formData.get("bankAccountName") as string | null;
        const bankAccountRut   = formData.get("bankAccountRut") as string | null;
        const bankName         = formData.get("bankName") as string | null;
        const bankAccountType  = formData.get("bankAccountType") as string | null;
        const bankAccountNumber = formData.get("bankAccountNumber") as string | null;
        const bankAccountEmail  = formData.get("bankAccountEmail") as string | null;

        // Lista de espera y contacto (stored in config JSON)
        const waitlistSize          = parseInt(formData.get("waitlistSize") as string) || 0;
        const waitlistActivation    = (formData.get("waitlistActivation") as string) || "AUTOMATIC";
        const registrationContact   = (formData.get("registrationContact") as string) || null;
        const registrationPhone     = (formData.get("registrationPhone") as string) || null;
        const registrationDeadline  = (formData.get("registrationDeadline") as string) || null;
        const groupsPublishDate     = (formData.get("groupsPublishDate") as string) || null;

        // Leer config existente para no perder campos no editables
        const existing = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { config: true }
        });
        const existingConfig = (existing?.config as Record<string, unknown>) ?? {};

        const playersPerGroup = groupFormat === "RR_3" ? 3 : 4;

        const config = {
            ...existingConfig,
            groupFormat,
            groups: { size: playersPerGroup, advance: advancingCount },
            advancingCount,
            inningsPerPhase,
            playerCount,
            hasHandicap,
            registrationFee,
            tables,
            turns,
            bracketSize,
            distanceGroups,
            distancePlayoffs,
            distanceFinal,
            inningsGroups,
            inningsPlayoffs,
            waitlistSize,
            waitlistActivation,
            timeControl: { mode: timeControlMode, secondsPerShot, extensionsPerPlayer },
            ...(bankAccountName ? { bankAccountName } : {}),
            ...(bankAccountRut  ? { bankAccountRut  } : {}),
            ...(bankName        ? { bankName        } : {}),
            ...(bankAccountType ? { bankAccountType } : {}),
            ...(bankAccountNumber ? { bankAccountNumber } : {}),
            ...(bankAccountEmail  ? { bankAccountEmail  } : {}),
            ...(registrationContact  ? { registrationContact  } : {}),
            ...(registrationPhone    ? { registrationPhone    } : {}),
            ...(registrationDeadline ? { registrationDeadline } : {}),
            ...(groupsPublishDate    ? { groupsPublishDate    } : {}),
        };

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        await prisma.tournament.update({
            where: { id: tournamentId },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                venue: venueAddress?.trim() || null,
                venueClubId: (venueClubId && uuidRegex.test(venueClubId)) ? venueClubId : null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                status: status as any,
                scope: scope as any,
                tenantId: tenantId || null,
                maxTables,
                hasTimeLimit,
                secondsPerShot,
                extensionsPerPlayer,
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
