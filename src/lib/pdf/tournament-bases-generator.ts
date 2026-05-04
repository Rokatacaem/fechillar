import { jsPDF } from 'jspdf';
import { Tournament, Club } from '@prisma/client';
import { getBase64Image } from './image-utils';

interface TournamentWithClub extends Tournament {
  venueClub: Club | null;
  hostClub: Club | null;
}

export async function generateTournamentBasesPDF(
  tournament: TournamentWithClub,
  isHandicap: boolean
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // ============ HEADER CON LOGOS (Alineación Proporcional) ============
  const headerY = 15;
  const maxHeaderHeight = 20;

  // Logo Fechillar (izquierda)
  const fechillarLogo = getBase64Image('/assets/logos/fechillar.png');
  if (fechillarLogo) {
    // Usamos ancho fijo de 22mm, alto proporcional (0)
    doc.addImage(fechillarLogo, 'PNG', 15, headerY, 22, 0);
  }

  // Logo Club Santiago (centro)
  const clubLogo = getBase64Image('/assets/logos/club santiago.jpg');
  if (clubLogo) {
    // Usamos ancho fijo de 18mm, alto proporcional (0)
    doc.addImage(clubLogo, 'JPEG', (pageWidth / 2) - 9, headerY, 18, 0);
  }

  // Logo IND / Gobierno (derecha)
  const gobiernoLogo = getBase64Image('/assets/logos/Instituto-nacional-de-deportes.png');
  if (gobiernoLogo) {
    // Usamos ancho fijo de 32mm, alto proporcional (0)
    doc.addImage(gobiernoLogo, 'PNG', pageWidth - 15 - 32, headerY, 32, 0);
  }

  y = headerY + maxHeaderHeight + 5;

  // ============ TÍTULO PRINCIPAL ============
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BASES TORNEO NACIONAL', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Subtítulo con handicap
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(isHandicap ? 'Torneo con Handicap' : 'Torneo sin Handicap', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Tercera línea: Club
  doc.setFontSize(12);
  doc.text(tournament.hostClub?.name || tournament.venue || 'Federación Nacional de Billar', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // ============ INFORMACIÓN GENERAL (PÁGINA 1) ============
  doc.setFontSize(10);
  const col1X = 20;
  
  // FECHA DEL EVENTO
  doc.setFillColor(235, 245, 255); // Azul muy claro
  doc.rect(col1X, y, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA DEL EVENTO', col1X + 2, y + 5.5);
  y += 10;
  
  const formatDate = (date: Date) => {
    const d = date.getUTCDate().toString().padStart(2, '0');
    const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${d}-${m}-${y}`;
  };

  const dateText = `${formatDate(tournament.startDate)}${tournament.endDate ? ` y ${formatDate(tournament.endDate)}` : ''}`;
  doc.setFont('helvetica', 'normal');
  doc.text(dateText, col1X + 2, y);
  y += 10;

  // SEDE DEL EVENTO
  doc.setFillColor(235, 245, 255);
  doc.rect(col1X, y, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('SEDE DEL EVENTO', col1X + 2, y + 5.5);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(tournament.venueClub?.name || tournament.venue || 'Por definir', col1X + 2, y);
  y += 5;
  if (tournament.venueClub?.address || tournament.location) {
    doc.setFontSize(9);
    doc.text(tournament.venueClub?.address || tournament.location || '', col1X + 2, y);
    y += 5;
  }
  y += 8;

  // INSCRIPCIONES
  doc.setFillColor(235, 245, 255);
  doc.rect(col1X, y, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('INSCRIPCIONES', col1X + 2, y + 5.5);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`• Capacidad Máxima: ${(tournament as any).maxCapacity || 54} jugadores`, col1X + 2, y); y += 5;
  doc.text(`• Formato: Grupos de 3 jugadores`, col1X + 2, y); y += 5;
  doc.text(`• Costo de Inscripción: $30.000`, col1X + 2, y);
  y += 12;

  // DATOS BANCARIOS
  if ((tournament as any).bankAccountName) {
    doc.setFillColor(235, 245, 255);
    doc.rect(col1X, y, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS PARA TRANSFERENCIA ELECTRÓNICA', col1X + 2, y + 5.5);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`• Nombre: ${(tournament as any).bankAccountName}`, col1X + 2, y); y += 5;
    doc.text(`• RUT: ${(tournament as any).bankAccountRut}`, col1X + 2, y); y += 5;
    doc.text(`• Banco: ${(tournament as any).bankName}`, col1X + 2, y); y += 5;
    doc.text(`• Número Cuenta: ${(tournament as any).bankAccountNumber} (${(tournament as any).bankAccountType})`, col1X + 2, y); y += 5;
    doc.text(`• Correo: ${(tournament as any).bankAccountEmail}`, col1X + 2, y);
  }

  // ============ FORMATO DEL TORNEO (PÁGINA 2) ============
  doc.addPage();
  y = 25;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMATO DEL TORNEO', pageWidth / 2, y, { align: 'center' });
  y += 12;

  const capacity = (tournament as any).maxCapacity || 54;
  const playersPerGroup = 3;
  const totalGroups = 18;
  const config = (tournament as any).adjustmentPhaseConfig || {};
  const bracketSize = (tournament as any).playoffBracketSize || 32;
  const tables = 6;

  // 1. FASE DE GRUPOS
  doc.setFillColor(235, 255, 240); // Verde muy claro
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.text('1. FASE DE GRUPOS Y SEGMENTACIÓN HORARIA', col1X + 2, y + 5);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Formato: 18 grupos de 3 jugadores. Distribución por Snake Seeding segmentado.`, col1X + 2, y); y += 5;
  doc.text(`• Turnos: T1 (10:00-13:00) | T2 (13:00-18:00) | T3 (18:00-21:00).`, col1X + 2, y); y += 5;
  doc.text(`• Regla W.O.: En inasistencia en grupos de 3, se aplicará Double Round Robin entre los presentes.`, col1X + 2, y);
  y += 10;

  // 2. RANKING DE CLASIFICADOS
  doc.setFillColor(235, 255, 240);
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. CLASIFICACIÓN A LLAVE FINAL', col1X + 2, y + 5);
  y += 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Avanzan los 2 mejores de cada grupo (36 jugadores). Se rankean por PGP, carambolas y directo.`, col1X + 2, y);
  y += 10;

  // 3. FASE DE AJUSTE (BARRAGE)
  doc.setFillColor(235, 255, 240);
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('3. FASE DE AJUSTE (BARRAGE)', col1X + 2, y + 5);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Clasificación directa: Puestos 1 al 28 avanzan a 16vos de final.`, col1X + 2, y); y += 5;
  doc.text(`• Barrage (4 cupos): Puestos 29 al 36 juegan eliminatoria previa.`, col1X + 2, y); y += 5;
  doc.text(`• Emparejamientos: 29vs36, 30vs35, 31vs34, 32vs33.`, col1X + 2, y); y += 5;
  doc.text(`• Resultado: 28 directos + 4 ganadores = 32 jugadores en llave final.`, col1X + 2, y);
  y += 10;

  // 4. FASE ELIMINATORIA
  doc.setFillColor(235, 255, 240);
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('4. FASE ELIMINATORIA', col1X + 2, y + 5);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fases = [
    'Dieciseisavos de final (32 jugadores)',
    'Octavos de final (16 jugadores)',
    'Cuartos de final (8 jugadores)',
    'Semifinales y definición del 3er lugar',
    'Gran Final por el campeonato'
  ];
  fases.forEach(f => {
    doc.text(`• ${f}`, col1X + 2, y);
    y += 5;
  });
  y += 5;

  // 5. MODALIDAD DE JUEGO
  doc.setFillColor(235, 255, 240);
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('5. MODALIDAD DE JUEGO', col1X + 2, y + 5);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Grupos/Eliminatorias: ${(tournament as any).distanceGroups || 25} carambolas (Tope 35 entradas)`, col1X + 2, y); y += 5;
  doc.text(`• Gran Final: ${(tournament as any).distanceFinal || 30} carambolas (Sin límite de entradas)`, col1X + 2, y); y += 5;
  doc.text('• Sistema: Nacional (Sin handicap)', col1X + 2, y);
  y += 10;

  // 6. DISTRIBUCIÓN DE MESAS
  doc.setFillColor(235, 255, 240);
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('6. INFRAESTRUCTURA Y CRONOGRAMA', col1X + 2, y + 5);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• 6 mesas oficiales disponibles. Grupos en 3 turnos rotativos.`, col1X + 2, y); y += 5;
  doc.text('• Programación sujeta a Director de Torneo.', col1X + 2, y);

  // ============ PREMIACIÓN Y REGLAS (PÁGINA 3) ============
  doc.addPage();
  y = 25;

  // PREMIACIÓN
  doc.setFillColor(255, 245, 235); // Naranja muy claro
  doc.rect(col1X, y, 170, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PREMIOS EN DINERO', col1X + 2, y + 5.5);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  if ((tournament as any).prizeDistribution && Array.isArray((tournament as any).prizeDistribution)) {
    ((tournament as any).prizeDistribution as any[]).forEach((prize) => {
      doc.text(`• ${prize.label}: ${prize.percentage}%`, col1X + 2, y);
      y += 5;
    });
  } else {
    const defaultPrizes = ['1°: 35%', '2°: 25%', '3° y 4°: 12% c/u', '5° al 8°: 4% c/u'];
    defaultPrizes.forEach(p => { doc.text(`• ${p}`, col1X + 2, y); y += 5; });
  }
  y += 12;

  // REGLAS GENERALES
  doc.setFillColor(245, 240, 255); // Púrpura muy claro
  doc.rect(col1X, y, 170, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('REGLAS GENERALES', col1X + 2, y + 5.5);
  y += 12;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const reglas = [
    'Puntualidad: 10 min de espera antes de W.O.',
    'Vestimenta: Uniforme Clase B (Polo club, pantalón de vestir, zapatos negros)',
    'Conducta: Prohibido fumar o asistir bajo influencia de alcohol/drogas',
    'Desempates: PGP > Carambolas > Resultado Directo'
  ];
  reglas.forEach(r => { doc.text(`• ${r}`, col1X + 2, y); y += 6; });

  // ============ FOOTER (Centrado y Seguro) ============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `FECHILLAR - ${tournament.name} - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const pdfBlob = doc.output('arraybuffer');
  return Buffer.from(pdfBlob);
}
