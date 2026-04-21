import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTournamentStandings } from "@/lib/tournament-results";
import { generateTournamentStandingsPDF } from "@/lib/billiards/pdf.tsx";
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

        // 2. Resolver Logos (Paths Locales para react-pdf)
        const publicDir = path.join(process.cwd(), "public");
        const fechillarLogoPath = path.join(publicDir, "fechillar_logo_final.png");
        
        let venueLogoPath: string | undefined = undefined;
        if (tournament.venueClub?.logoUrl) {
            // Si el logo es una URL externa, react-pdf la manejará, 
            // pero si es local o relativa, la resolvemos.
            venueLogoPath = tournament.venueClub.logoUrl;
            if (venueLogoPath.startsWith("/")) {
                venueLogoPath = path.join(publicDir, venueLogoPath);
            }
        }

        // 3. Generar PDF
        const pdfStream = await generateTournamentStandingsPDF(
            tournament,
            participants,
            fechillarLogoPath,
            venueLogoPath
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
