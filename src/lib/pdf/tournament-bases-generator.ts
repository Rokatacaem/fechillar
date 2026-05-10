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
  const cfg = (tournament.config as any) || {};

  // --- Datos del config ---
  const capacity: number = cfg.maxPlayers || cfg.playerCount || (tournament.maxTables * tournament.playersPerTable) || 16;
  const groupFormat: string = cfg.groupFormat || 'RR_4';
  const playersPerGroup: number = groupFormat === 'RR_3' ? 3 : 4;
  const qualifiedPerGroup: number = cfg.qualifiedPerGroup ?? cfg.advancingCount ?? 2;
  const bracketSize: number = cfg.bracketSize || 8;
  const totalGroups: number = Math.floor(capacity / playersPerGroup);
  const totalClasificados: number = totalGroups * qualifiedPerGroup;
  const tables: number = cfg.tables || tournament.maxTables || 4;
  const turns: number = cfg.turns || 3;
  const inningsGroups: number = cfg.inningsPerPhase || 25;
  const registrationFee: number = cfg.registrationFee || 30000;
  const diferencia: number = totalClasificados - bracketSize;

  const grupoPPG = playersPerGroup === 3 ? 'grupos de 3 jugadores' : 'grupos de 4 jugadores';
  const sistemaText = isHandicap ? 'Sistema con Hándicap' : 'Nacional (Sin hándicap)';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;
  const col1X = 20;

  // ============ HEADER CON LOGOS ============
  const headerY = 15;
  const maxHeaderHeight = 20;

  const fechillarLogo = getBase64Image('/assets/logos/fechillar.png');
  if (fechillarLogo) doc.addImage(fechillarLogo, 'PNG', 15, headerY, 22, 0);

  const clubLogo = getBase64Image('/assets/logos/club santiago.jpg');
  if (clubLogo) doc.addImage(clubLogo, 'JPEG', (pageWidth / 2) - 9, headerY, 18, 0);

  const gobiernoLogo = getBase64Image('/assets/logos/Instituto-nacional-de-deportes.png');
  if (gobiernoLogo) doc.addImage(gobiernoLogo, 'PNG', pageWidth - 15 - 32, headerY, 32, 0);

  y = headerY + maxHeaderHeight + 5;

  // ============ TÍTULO PRINCIPAL ============
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BASES TORNEO NACIONAL', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(isHandicap ? 'Torneo con Hándicap' : 'Torneo sin Hándicap', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.text(tournament.hostClub?.name || tournament.venue || 'Federación Nacional de Billar', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // ============ FECHA DEL EVENTO ============
  const formatDate = (date: Date) => {
    const d = date.getUTCDate().toString().padStart(2, '0');
    const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${d}-${m}-${date.getUTCFullYear()}`;
  };

  doc.setFillColor(235, 245, 255);
  doc.rect(col1X, y, 170, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA DEL EVENTO', col1X + 2, y + 5.5);
  y += 10;

  const dateText = `${formatDate(tournament.startDate)}${tournament.endDate ? ` y ${formatDate(tournament.endDate)}` : ''}`;
  doc.setFont('helvetica', 'normal');
  doc.text(dateText, col1X + 2, y);
  y += 10;

  // ============ SEDE DEL EVENTO ============
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

  // ============ INSCRIPCIONES ============
  doc.setFillColor(235, 245, 255);
  doc.rect(col1X, y, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INSCRIPCIONES', col1X + 2, y + 5.5);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`• Capacidad Máxima: ${capacity} jugadores`, col1X + 2, y); y += 5;
  doc.text(`• Formato: ${totalGroups} ${grupoPPG}`, col1X + 2, y); y += 5;
  doc.text(`• Costo de Inscripción: $${registrationFee.toLocaleString('es-CL')}`, col1X + 2, y);
  y += 12;

  // ============ DATOS BANCARIOS (si existen en config) ============
  if (cfg.bankAccountName) {
    doc.setFillColor(235, 245, 255);
    doc.rect(col1X, y, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DATOS PARA TRANSFERENCIA ELECTRÓNICA', col1X + 2, y + 5.5);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (cfg.bankAccountName) { doc.text(`• Nombre: ${cfg.bankAccountName}`, col1X + 2, y); y += 5; }
    if (cfg.bankAccountRut) { doc.text(`• RUT: ${cfg.bankAccountRut}`, col1X + 2, y); y += 5; }
    if (cfg.bankName) { doc.text(`• Banco: ${cfg.bankName}`, col1X + 2, y); y += 5; }
    if (cfg.bankAccountNumber) { doc.text(`• Número Cuenta: ${cfg.bankAccountNumber}${cfg.bankAccountType ? ` (${cfg.bankAccountType})` : ''}`, col1X + 2, y); y += 5; }
    if (cfg.bankAccountEmail) { doc.text(`• Correo: ${cfg.bankAccountEmail}`, col1X + 2, y); }
  }

  // ============ FORMATO DEL TORNEO (PÁGINA 2) ============
  doc.addPage();
  y = 25;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMATO DEL TORNEO', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // 1. FASE DE GRUPOS
  doc.setFillColor(235, 255, 240);
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. FASE DE GRUPOS Y SEGMENTACIÓN HORARIA', col1X + 2, y + 5);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Formato: ${totalGroups} ${grupoPPG}. Distribución por Snake Seeding segmentado.`, col1X + 2, y); y += 5;

  const turnoLabels: Record<number, string> = {
    1: 'T1 (10:00-13:00)',
    2: 'T1 (10:00-13:00) | T2 (13:00-18:00)',
    3: 'T1 (10:00-13:00) | T2 (13:00-18:00) | T3 (18:00-21:00)',
  };
  doc.text(`• Turnos: ${turnoLabels[turns] || `${turns} turnos`}.`, col1X + 2, y); y += 5;

  const woRule = playersPerGroup === 3
    ? '• Regla W.O.: En inasistencia en grupos de 3, se aplicará Double Round Robin entre los presentes.'
    : '• Regla W.O.: En inasistencia, el jugador presente gana por W.O. (25-0).';
  const woLines = doc.splitTextToSize(woRule, 165);
  doc.text(woLines, col1X + 2, y); y += woLines.length * 5 + 5;

  // 2. CLASIFICACIÓN A LLAVE FINAL
  doc.setFillColor(235, 255, 240);
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. CLASIFICACIÓN A LLAVE FINAL', col1X + 2, y + 5);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const clasificacionText = `Avanzan los ${qualifiedPerGroup} mejor${qualifiedPerGroup > 1 ? 'es' : ''} de cada grupo (${totalClasificados} jugadores). Se rankean por PGP, carambolas y resultado directo.`;
  const clLines = doc.splitTextToSize(clasificacionText, 165);
  doc.text(clLines, col1X + 2, y); y += clLines.length * 5 + 5;

  // 3. FASE DE AJUSTE (si aplica) o paso directo al cuadro
  if (diferencia > 0) {
    const playoffPlayers = diferencia * 2;
    const directos = totalClasificados - playoffPlayers;

    doc.setFillColor(235, 255, 240);
    doc.rect(col1X, y, 170, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('3. FASE DE AJUSTE (BARRAGE)', col1X + 2, y + 5);
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Clasificación directa: Puestos 1 al ${directos} avanzan al cuadro de ${bracketSize}.`, col1X + 2, y); y += 5;
    doc.text(`• Barrage (${diferencia} cupos): Puestos ${directos + 1} al ${totalClasificados} juegan eliminatoria previa.`, col1X + 2, y); y += 5;
    doc.text(`• Resultado: ${directos} directos + ${diferencia} ganadores = ${bracketSize} jugadores en llave final.`, col1X + 2, y);
    y += 10;

    // 4. FASE ELIMINATORIA
    doc.setFillColor(235, 255, 240);
    doc.rect(col1X, y, 170, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('4. FASE ELIMINATORIA', col1X + 2, y + 5);
    y += 10;
  } else {
    doc.setFillColor(235, 255, 240);
    doc.rect(col1X, y, 170, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('3. FASE ELIMINATORIA', col1X + 2, y + 5);
    y += 10;
  }

  const fasesElim: string[] = [];
  let current = bracketSize;
  while (current >= 2) {
    if (current === 2) {
      fasesElim.push('Gran Final por el campeonato');
      break;
    }
    if (current === 4) {
      fasesElim.push(`Semifinales y definición del 3er lugar (${current} jugadores)`);
    } else {
      fasesElim.push(`${current === 8 ? 'Cuartos' : current === 16 ? 'Octavos' : current === 32 ? 'Dieciseisavos' : `Ronda de ${current}`} de final (${current} jugadores)`);
    }
    current = current / 2;
  }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  fasesElim.forEach(f => { doc.text(`• ${f}`, col1X + 2, y); y += 5; });
  y += 5;

  // MODALIDAD DE JUEGO
  const siguienteSec = diferencia > 0 ? '5' : '4';
  doc.setFillColor(235, 255, 240);
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${siguienteSec}. MODALIDAD DE JUEGO`, col1X + 2, y + 5);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Grupos/Eliminatorias: ${inningsGroups} carambolas (Tope ${inningsGroups + 10} entradas)`, col1X + 2, y); y += 5;
  doc.text(`• Gran Final: ${inningsGroups + 5} carambolas (Sin límite de entradas)`, col1X + 2, y); y += 5;
  doc.text(`• Sistema: ${sistemaText}`, col1X + 2, y);
  y += 10;

  // INFRAESTRUCTURA
  const sigSec = diferencia > 0 ? '6' : '5';
  doc.setFillColor(235, 255, 240);
  doc.rect(col1X, y, 170, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sigSec}. INFRAESTRUCTURA Y CRONOGRAMA`, col1X + 2, y + 5);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• ${tables} mesas oficiales disponibles. Grupos en ${turns} turno${turns > 1 ? 's' : ''} rotativo${turns > 1 ? 's' : ''}.`, col1X + 2, y); y += 5;
  doc.text('• Programación sujeta a Director de Torneo.', col1X + 2, y);

  // ============ PREMIACIÓN Y REGLAS (PÁGINA 3) ============
  doc.addPage();
  y = 25;

  doc.setFillColor(255, 245, 235);
  doc.rect(col1X, y, 170, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PREMIOS EN DINERO', col1X + 2, y + 5.5);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  if (cfg.prizeDistribution && Array.isArray(cfg.prizeDistribution)) {
    (cfg.prizeDistribution as any[]).forEach((prize: any) => {
      doc.text(`• ${prize.label}: ${prize.percentage}%`, col1X + 2, y);
      y += 5;
    });
  } else {

    const defaultPrizes = ['1°: 35%', '2°: 25%', '3° y 4°: 12% c/u', '5° al 8°: 4% c/u'];
    defaultPrizes.forEach(p => { doc.text(`• ${p}`, col1X + 2, y); y += 5; });
  }
  y += 12;

  // REGLAS GENERALES
  doc.setFillColor(245, 240, 255);
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
    'Desempates: PGP > Carambolas > Resultado Directo',
  ];
  reglas.forEach(r => { doc.text(`• ${r}`, col1X + 2, y); y += 6; });

  // ============ FOOTER ============
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
