import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    if (!secret || secret !== process.env.SYNC_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const playerCount = await prisma.playerProfile.count();

        if (playerCount > 0) {
            console.log(`✅ DB tiene ${playerCount} jugadores — restore no requerido`);
            return NextResponse.json({ message: `DB OK (${playerCount} jugadores)`, restored: false });
        }

        console.log("⚠️ DB vacía detectada — iniciando restore desde Vercel Blob...");

        const { blobs } = await list({ prefix: "backups/latest" });

        if (blobs.length === 0) {
            console.error("❌ No hay backup en Vercel Blob");
            return NextResponse.json(
                { error: "No hay backup en Vercel Blob. Ejecuta: npm run backup && npm run backup:upload" },
                { status: 404 }
            );
        }

        const backupResponse = await fetch(blobs[0].url, {
            headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        });
        const backupData = await backupResponse.json();

        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "https://fechillar-three.vercel.app";

        const restoreResponse = await fetch(`${baseUrl}/api/admin/restore-backup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-sync-secret": process.env.SYNC_SECRET!,
            },
            body: JSON.stringify(backupData),
        });

        const result = await restoreResponse.json();

        if (!restoreResponse.ok) {
            console.error("❌ Error en restore:", result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        console.log("✅ Restore automático completado:", result.stats);
        return NextResponse.json({
            message: "Restore automático completado",
            restored: true,
            stats: result.stats,
        });

    } catch (e: any) {
        console.error("Error en post-deploy webhook:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
