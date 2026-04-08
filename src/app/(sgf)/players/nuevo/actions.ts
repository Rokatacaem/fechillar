"use server";

import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPlayer(formData: FormData) {
    console.log("SERVER ACTION: Registrando nuevo jugador...");
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const rut = formData.get("rut") as string;
    const tenantId = formData.get("tenantId") as string;
    const imageFile = formData.get("photo") as File;

    let photoUrl = "";

    // 1. Subida de foto a Vercel Blob
    if (imageFile && imageFile.size > 0) {
        try {
            const blob = await put(`players/${rut}.jpg`, imageFile, {
                access: "public",
            });
            photoUrl = blob.url;
        } catch (error) {
            console.error("Vercel Blob Error:", error);
        }
    }

    // 2. Transacción Atómica: User + PlayerProfile
    // El esquema requiere que PlayerProfile tenga un userId (User)
    try {
        await prisma.$transaction(async (tx) => {
            // A. Crear Usuario base (donde reside el nombre y email)
            const user = await tx.user.create({
                data: {
                    email,
                    name: `${firstName} ${lastName}`,
                    role: "PLAYER",
                },
            });

            // B. Crear Perfil de Jugador vinculado al Usuario
            // Nota: firstName/lastName/status NO están en el modelo PlayerProfile del esquema
            await tx.playerProfile.create({
                data: {
                    userId: user.id,
                    rut,
                    photoUrl,
                    tenantId,
                },
            });
        });
    } catch (error) {
        console.error("Database Transaction Error:", error);
        throw new Error("No se pudo registrar el jugador. El email o RUT podrían estar duplicados.");
    }

    revalidatePath("/players");
    redirect("/players");
}