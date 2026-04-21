"use server";

import { PrismaClient, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export async function updateUserRole(userId: string, newRole: UserRole, reason: string, clubId?: string) {
    const session = await auth();
    
    // Hard check de seguridad en Backend
    const callerRole = (session?.user as any)?.role;
    if (callerRole !== "SUPERADMIN" && callerRole !== "FEDERATION_ADMIN") {
        throw new Error("Autoridad Mágica Denegada. Escalafón insuficiente.");
    }

    if (!reason || reason.trim() === "") {
        throw new Error("El Tribunal requiere una razón obligatoria para la auditoría.");
    }

    // Validación de Sede para Roles de Autoridad Local
    const isLocalAuthority = ["CLUB_DELEGATE", "CLUB_ADMIN"].includes(newRole);
    if (isLocalAuthority && !clubId) {
        throw new Error(`El rol ${newRole} requiere la asignación obligatoria de una Sede (Club).`);
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Ejecución de la Acción Disciplinaria o Promoción
            await tx.user.update({
                where: { id: userId },
                data: { 
                    role: newRole,
                    // Si es autoridad local, asignamos el club. Si no, lo limpiamos para evitar inconsistencias.
                    managedClubId: isLocalAuthority ? clubId : null 
                }
            });

            // 2. Inyección mandatoria al AuditLog
            await tx.auditLog.create({
                data: {
                    action: `role_change_${newRole.toLowerCase()}`,
                    targetId: userId,
                    userId: session!.user!.id!,
                    details: JSON.stringify({
                        event: "TRIBUNAL_DISCIPLINARIO",
                        newRole: newRole,
                        reason: reason,
                        assignedClubId: isLocalAuthority ? clubId : null,
                        timestamp: new Date().toISOString()
                    })
                }
            });
        });

        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error: any) {
        console.error("Tribunal Critical Failure:", error);
        throw new Error(error.message || "Error fatal en la transaccionalidad del Tribunal.");
    }
}

export async function importSanMiguelData() {
    throw new Error("⛔ MIGRACIÓN BLOQUEADA POR EL COMANDANTE: El modo manual está activo y la auto-importación ha sido erradicada del núcleo.");
}

