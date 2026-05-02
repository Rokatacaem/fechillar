import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMatchSheetsPDF } from '@/lib/pdf/match-sheet-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const phaseId = searchParams.get('phaseId');
    const groupId = searchParams.get('groupId');

    const matches = await prisma.match.findMany({
      where: {
        tournamentId: params.id,
        ...(phaseId === 'groups' ? { groupId: { not: null } } : phaseId ? { phaseId } : {}),
        ...(groupId ? { groupId } : {}),
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
        tournament: { select: { name: true, discipline: true, category: true } },
        group: { select: { name: true } }
      },
      orderBy: [
        { round: 'asc' },
        { matchOrder: 'asc' }
      ],
    });

    if (matches.length === 0) {
      return NextResponse.json({ error: 'No se encontraron partidos para los filtros seleccionados' }, { status: 404 });
    }

    const pdfBuffer = await generateMatchSheetsPDF(matches);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Planillas_Torneo_${params.id.substring(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generando planillas:', error);
    return NextResponse.json({ error: 'Error generando planillas' }, { status: 500 });
  }
}
