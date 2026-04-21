import { NextRequest, NextResponse } from "next/server";
import { generatePlayerReportPDF } from "@/lib/billiards/pdf.tsx";
import { getPlayerPerformanceMetrics, getPGPTrend } from "@/lib/billiards/analytics";
import { auth } from "@/auth";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        // Soft Check: Puedes restringir esto para que solo admins exporten o el propio jugador
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const playerId = params.id;

        // 1. Gather Big Data
        const baseMetrics = await getPlayerPerformanceMetrics(playerId);
        const trendData = await getPGPTrend(playerId);

        // Map shape required by PDF Engine
        const playerMetricsPayload = {
            playerId,
            name: "JUGADOR DEL SISTEMA", // En un entorno real, cruzar con un findUnique al modelo PlayerProfile
            average: baseMetrics.average,
            highRun: baseMetrics.highRun,
            totalScore: baseMetrics.totalScore,
            totalInnings: baseMetrics.totalInnings,
            trendData: trendData.length > 0 ? trendData : [{ date: "2026-01-01", pgp: 0 }], // fallback
        };

        // 2. Generate PDF Stream
        const pdfStream = await generatePlayerReportPDF(playerMetricsPayload);

        // 3. Convert Node stream to Web Stream Response
        // Since React-PDF renderToStream outputs a NodeJS.ReadableStream, we need to adapt it.
        const webReadableStream = new ReadableStream({
            start(controller) {
                pdfStream.on('data', (chunk) => controller.enqueue(chunk));
                pdfStream.on('end', () => controller.close());
                pdfStream.on('error', (err) => controller.error(err));
            }
        });

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename="Ficha_Deportiva_${playerId}.pdf"`);

        return new NextResponse(webReadableStream, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error("PDF EXPORT ERORR:", error);
        return new NextResponse("Error generating PDF", { status: 500 });
    }
}
