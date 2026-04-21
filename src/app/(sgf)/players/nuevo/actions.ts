"use server";

import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Category, Discipline } from "@prisma/client";
import { CATEGORY_TARGETS } from "@/lib/billiards/constants";

export async function createPlayer(formData: FormData) {
    const session = await auth();
    if (!session || !["SUPERADMIN", "FEDERATION_ADMIN"].includes((session.user as any).role)) {
        throw new Error("No autorizado");
    }

    console.log("SERVER ACTION: Registrando nuevo jugador federado...");
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const rut = formData.get("rut") as string;
    const clubId = formData.get("clubId") as string;
    const category = formData.get("category") as Category;
    const discipline = (formData.get("discipline") as Discipline) || Discipline.THREE_BAND;
    const imageFile = formData.get("photo") as File;

    const fullName = `${firstName} ${lastName}`;
    const slug = fullName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + "-" + Math.random().toString(36).substring(2, 7);

    let photoUrl = "";

    // 1. Subida de foto a Vercel Blob (Opcional)
    if (imageFile && imageFile.size > 0) {
        try {
            const blob = await put(`players/${rut || Date.now()}.jpg`, imageFile, {
                access: "public",
            });
            photoUrl = blob.url;
        } catch (error) {
            console.error("Vercel Blob Error:", error);
        }
    }

    try {
        // Resiliencia: Asegurar que el actor (admin) existe en la DB para la auditoría
        const dbAdmin = await prisma.user.upsert({
            where: { email: session.user.email as string },
            update: {},
            create: {
                email: session.user.email as string,
                name: session.user.name || "Admin",
                role: (session.user as any).role
            }
        });

        await prisma.$transaction(async (tx) => {
            // A. Crear Usuario base
            const user = await tx.user.create({
                data: {
                    email,
                    name: fullName,
                    role: "PLAYER",
                },
            });

            // B. Crear Perfil de Jugador
            const profile = await tx.playerProfile.create({
                data: {
                    userId: user.id,
                    rut,
                    slug,
                    photoUrl,
                    tenantId: clubId, // Vinculación al Club
                },
            });

            // C. Inicializar Ranking (Categoría Federativa)
            await tx.ranking.create({
                data: {
                    playerId: profile.id,
                    discipline,
                    category,
                    points: 0,
                    handicapTarget: discipline === Discipline.THREE_BAND ? (CATEGORY_TARGETS[category] || 15) : 15
                }
            });

            // D. Log de Auditoría
            await tx.auditLog.create({
                data: {
                    action: "PLAYER_CREATE",
                    targetId: profile.id,
                    userId: dbAdmin.id,
                    details: `Alta de jugador: ${fullName} en Club: ${clubId}. Categoría: ${category}`
                }
            });
        });
    } catch (error: any) {
        console.error("Database Error:", error);
        if (error.code === 'P2002') {
            throw new Error("El RUT o Email ya están registrados en el Padrón Nacional.");
        }
        throw new Error("Error crítico al registrar en la base de datos.");
    }

    revalidatePath("/federacion/padron");
    redirect("/federacion/padron");
}