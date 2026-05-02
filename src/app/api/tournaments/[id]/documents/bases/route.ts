import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTournamentBasesPDF } from '@/lib/pdf/tournament-bases-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== GENERANDO PDF DE BASES ===');
    console.log('Tournament ID:', params.id);

    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: { venueClub: true, hostClub: true },
    });

    if (!tournament) {
      console.error('Torneo no encontrado');
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }

    console.log('Torneo encontrado:', tournament.name);

    const isHandicap = tournament.modality?.toLowerCase()?.includes('handicap') || false;
    console.log('Es con handicap:', isHandicap);

    console.log('Generando PDF...');
    const pdfBuffer = await generateTournamentBasesPDF(tournament, isHandicap);
    console.log('PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');

    const safeName = tournament.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="Bases_${safeName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('=== ERROR COMPLETO ===');
    console.error(error);
    return NextResponse.json({ 
      error: 'Error generando PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
