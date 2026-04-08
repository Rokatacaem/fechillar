"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createTournament(formData: FormData) {
    const session = await auth();
    
    if (!session || !session.user) {
        throw new Error("No autorizado");
    }

    const role = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;
    const userId = session.user.id; // asumiendo que id está en el JWT payload base de Auth.js

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const discipline = formData.get("discipline") as string;
    const modality = formData.get("modality") as string;
    const category = formData.get("category") as string;
    const status = formData.get("status") as string;
    const startDateRaw = formData.get("startDate") as string;
    const endDateRaw = formData.get("endDate") as string;
    const scope = formData.get("scope") as "NATIONAL" | "INTERNAL";

    // Validaciones de Control de Acceso (RBAC)
    if (scope === "NATIONAL") {
        if (role !== "FEDERATION_DELEGATE" && role !== "FEDERATION_ADMIN" && role !== "SUPERADMIN") {
            throw new Error("Permisos insuficientes para crear un Torneo Nacional");
        }
    }

    if (scope === "INTERNAL") {
        if (role !== "CLUB_DELEGATE" && role !== "CLUB_ADMIN" && role !== "FEDERATION_ADMIN" && role !== "SUPERADMIN") {
            throw new Error("Permisos insuficientes para gestionar torneos de club");
        }
        if (!tenantId) {
            throw new Error("No puedes crear un torneo interno porque no perteneces a un club (tenantId missing)");
        }
    }

    // Forzar el tenantId si es INTERNAL (para evitar que alguien inyecte otro club)
    const finalTenantId = scope === "INTERNAL" ? tenantId : null;

    try {
        const tournament = await prisma.tournament.create({
            data: {
                name,
                description,
                discipline,
                modality,
                category,
                status,
                scope: scope || "INTERNAL",
                tenantId: finalTenantId,
                createdById: userId,
                startDate: new Date(startDateRaw),
                endDate: endDateRaw ? new Date(endDateRaw) : null,
            }
        });

        // Crear una auto-asignación si el creador es delegado, para que tenga permiso explícito
        if (role === "CLUB_DELEGATE" || role === "FEDERATION_DELEGATE") {
            await prisma.tournamentAssignment.create({
                data: {
                    tournamentId: tournament.id,
                    userId: userId,
                    permissions: "OWNER,WRITE_RESULTS"
                }
            });
        }

        revalidatePath("/tournaments");
        return { success: true, id: tournament.id };
    } catch (error: any) {
        console.error("Error creating tournament:", error);
        throw new Error("Error interno al crear torneo");
    }
}
