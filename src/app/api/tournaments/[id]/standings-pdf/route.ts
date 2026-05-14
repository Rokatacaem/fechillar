import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTournamentStandings } from "@/lib/tournament-results";
import { generateTournamentStandingsPDF } from "@/lib/billiards/pdf-billiards";
import * as path from "path";
import * as fs from "fs";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const tournamentId = resolvedParams.id;

    try {
        // 1. Obtener Datos
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { venueClub: true }
        });

        if (!tournament) {
            return new NextResponse("Torneo no encontrado", { status: 404 });
        }

        const participants = await getTournamentStandings(tournamentId);

        // 2. Resolver Logos (todos desde public/assets/logos/)
        const logosDir = path.join(process.cwd(), "public", "assets", "logos");

        const fechillarLogoPath = path.join(logosDir, "SoloEscudoLogo3DAzul.png");
        const indLogoPath       = path.join(logosDir, "Instituto-nacional-de-deportes.png");

        // Club organizador: intentar desde logoUrl del venueClub, si no buscar en assets/logos
        let clubLogoPath: string | undefined;
        if (tournament.venueClub?.logoUrl) {
            const raw = tournament.venueClub.logoUrl;
            const resolved = raw.startsWith("/")
                ? path.join(process.cwd(), "public", raw)
                : raw;
            if (fs.existsSync(resolved)) clubLogoPath = resolved;
        }
        if (!clubLogoPath) {
            // Fallback: buscar en assets/logos/ un archivo que contenga el nombre del club
            const clubName = (tournament.venueClub?.name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
            const files = fs.existsSync(logosDir) ? fs.readdirSync(logosDir) : [];
            const match = files.find(f => f.toLowerCase().includes(clubName.split(" ")[0] ?? ""));
            if (match) clubLogoPath = path.join(logosDir, match);
        }

        // 3. Generar PDF
        const pdfStream = await generateTournamentStandingsPDF(
            tournament,
            participants,
            fechillarLogoPath,
            clubLogoPath,
            fs.existsSync(indLogoPath) ? indLogoPath : undefined
        );

        // 4. Retornar Stream
        const response = new NextResponse(pdfStream as any);
        response.headers.set("Content-Type", "application/pdf");
        response.headers.set(
            "Content-Disposition", 
            `attachment; filename="Cuadro_Honor_${tournament.name.replace(/\s+/g, '_')}.pdf"`
        );

        return response;

    } catch (error: any) {
        console.error("PDF Generation Error:", error);
        return new NextResponse(`Error generando PDF: ${error.message}`, { status: 500 });
    }
}
