import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import path from 'path';
import { generateRankingReportPDF, RankingReportData } from '@/lib/billiards/ranking-pdf';

/**
 * GET /api/reports/ranking?discipline=THREE_BAND
 * GET /api/reports/ranking?discipline=THREE_BAND_ANNUAL
 *
 * Genera y descarga el PDF del Ranking Nacional o Anual.
 * Requiere sesión activa (cualquier rol).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const discipline = searchParams.get('discipline') ?? 'THREE_BAND';

  if (!['THREE_BAND', 'THREE_BAND_ANNUAL'].includes(discipline)) {
    return new NextResponse('Disciplina inválida', { status: 400 });
  }

  // Cargar jugadores con su ranking correspondiente
  const players = await prisma.playerProfile.findMany({
    include: {
      club: { select: { name: true } },
      rankings: {
        where: { discipline: discipline as 'THREE_BAND' | 'THREE_BAND_ANNUAL' },
        take: 1,
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  // Mapear a filas del PDF — solo jugadores con ranking en la disciplina
  const rows = players
    .filter(p => p.rankings.length > 0)
    .map(p => ({
      position: p.rankings[0].rankPosition ?? 999,
      firstName: p.firstName ?? '',
      lastName: p.lastName ?? '',
      clubName: p.club?.name ?? '',
      rankPosition: p.rankings[0].rankPosition,
      average: p.rankings[0].average,
      handicapTarget: p.rankings[0].handicapTarget,
      points: p.rankings[0].points,
    }))
    // Ordenar por rankPosition ascendente (sin ranking → al final)
    .sort((a, b) => {
      const posA = (!a.rankPosition || a.rankPosition >= 999) ? 9999 : a.rankPosition;
      const posB = (!b.rankPosition || b.rankPosition >= 999) ? 9999 : b.rankPosition;
      return posA - posB;
    });

  // Rutas absolutas a los logos (en /public/assets/logos)
  const publicDir = path.join(process.cwd(), 'public');
  const fechillarLogoPath = path.join(publicDir, 'assets', 'logos', 'Escudo.png');
  const indLogoPath       = path.join(publicDir, 'assets', 'logos', 'Instituto-nacional-de-deportes.png');

  const data: RankingReportData = {
    discipline: discipline as 'THREE_BAND' | 'THREE_BAND_ANNUAL',
    generatedAt: new Date().toLocaleDateString('es-CL', {
      day: '2-digit', month: 'long', year: 'numeric'
    }),
    rows,
    fechillarLogoPath,
    indLogoPath,
  };

  const pdfStream = await generateRankingReportPDF(data);

  const fileName = discipline === 'THREE_BAND_ANNUAL'
    ? 'Ranking-Anual-FECHILLAR.pdf'
    : 'Ranking-Nacional-FECHILLAR.pdf';

  // @ts-ignore — renderToStream devuelve un PassThrough compatible
  return new NextResponse(pdfStream as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
