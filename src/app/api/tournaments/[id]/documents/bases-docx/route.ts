import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from 'docx';

function bold(text: string) {
  return new TextRun({ text, bold: true });
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}` })],
    spacing: { after: 60 },
  });
}

function sectionHeader(text: string) {
  return new Paragraph({
    children: [bold(text)],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 100 },
    shading: { type: ShadingType.SOLID, color: 'EBF5FF' },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '3B82F6' } },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: { venueClub: true, hostClub: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
  }

  const isHandicap = tournament.modality === 'HANDICAP';
  const cfg = (tournament.config as any) || {};

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

  const grupoPPG = `${totalGroups} grupos de ${playersPerGroup} jugadores`;
  const sistemaText = isHandicap ? 'Sistema con Hándicap' : 'Nacional (Sin hándicap)';

  const formatDate = (d: Date) =>
    `${d.getUTCDate().toString().padStart(2, '0')}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}-${d.getUTCFullYear()}`;

  const dateText = `${formatDate(tournament.startDate)}${tournament.endDate ? ` y ${formatDate(tournament.endDate)}` : ''}`;

  const turnoLabels: Record<number, string> = {
    1: 'T1 (10:00-13:00)',
    2: 'T1 (10:00-13:00) | T2 (13:00-18:00)',
    3: 'T1 (10:00-13:00) | T2 (13:00-18:00) | T3 (18:00-21:00)',
  };

  const children: Paragraph[] = [];

  // ---- ENCABEZADO ----
  children.push(
    new Paragraph({
      children: [bold('BASES TORNEO NACIONAL')],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: isHandicap ? 'Torneo con Hándicap' : 'Torneo sin Hándicap', size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: tournament.hostClub?.name || tournament.venue || 'Federación Nacional de Billar', size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
  );

  // ---- FECHA ----
  children.push(sectionHeader('FECHA DEL EVENTO'));
  children.push(new Paragraph({ children: [new TextRun(dateText)], spacing: { after: 120 } }));

  // ---- SEDE ----
  children.push(sectionHeader('SEDE DEL EVENTO'));
  children.push(new Paragraph({ children: [new TextRun(tournament.venueClub?.name || tournament.venue || 'Por definir')], spacing: { after: 60 } }));
  if (tournament.venueClub?.address || tournament.location) {
    children.push(new Paragraph({ children: [new TextRun(tournament.venueClub?.address || tournament.location || '')], spacing: { after: 120 } }));
  }

  // ---- INSCRIPCIONES ----
  children.push(sectionHeader('INSCRIPCIONES'));
  children.push(bullet(`Capacidad Máxima: ${capacity} jugadores`));
  children.push(bullet(`Formato: ${grupoPPG}`));
  children.push(bullet(`Costo de Inscripción: $${registrationFee.toLocaleString('es-CL')}`));

  // ---- DATOS BANCARIOS ----
  if (cfg.bankAccountName) {
    children.push(sectionHeader('DATOS PARA TRANSFERENCIA ELECTRÓNICA'));
    if (cfg.bankAccountName) children.push(bullet(`Nombre: ${cfg.bankAccountName}`));
    if (cfg.bankAccountRut) children.push(bullet(`RUT: ${cfg.bankAccountRut}`));
    if (cfg.bankName) children.push(bullet(`Banco: ${cfg.bankName}`));
    if (cfg.bankAccountNumber) children.push(bullet(`Número Cuenta: ${cfg.bankAccountNumber}${cfg.bankAccountType ? ` (${cfg.bankAccountType})` : ''}`));
    if (cfg.bankAccountEmail) children.push(bullet(`Correo: ${cfg.bankAccountEmail}`));
  }

  // ---- FORMATO DEL TORNEO ----
  children.push(new Paragraph({ children: [bold('FORMATO DEL TORNEO')], heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 160 } }));

  children.push(sectionHeader('1. FASE DE GRUPOS Y SEGMENTACIÓN HORARIA'));
  children.push(bullet(`Formato: ${grupoPPG}. Distribución por Snake Seeding segmentado.`));
  children.push(bullet(`Turnos: ${turnoLabels[turns] || `${turns} turnos`}.`));
  children.push(bullet(playersPerGroup === 3
    ? 'Regla W.O.: En inasistencia en grupos de 3, se aplicará Double Round Robin entre los presentes.'
    : 'Regla W.O.: En inasistencia, el jugador presente gana por W.O. (25-0).'
  ));

  children.push(sectionHeader('2. CLASIFICACIÓN A LLAVE FINAL'));
  children.push(new Paragraph({
    children: [new TextRun(`Avanzan los ${qualifiedPerGroup} mejor${qualifiedPerGroup > 1 ? 'es' : ''} de cada grupo (${totalClasificados} jugadores). Se rankean por PGP, carambolas y resultado directo.`)],
    spacing: { after: 120 },
  }));

  let secNum = 3;

  if (diferencia > 0) {
    const playoffPlayers = diferencia * 2;
    const directos = totalClasificados - playoffPlayers;
    children.push(sectionHeader(`${secNum}. FASE DE AJUSTE (BARRAGE)`));
    children.push(bullet(`Clasificación directa: Puestos 1 al ${directos} avanzan al cuadro de ${bracketSize}.`));
    children.push(bullet(`Barrage (${diferencia} cupos): Puestos ${directos + 1} al ${totalClasificados} juegan eliminatoria previa.`));
    children.push(bullet(`Resultado: ${directos} directos + ${diferencia} ganadores = ${bracketSize} jugadores en llave final.`));
    secNum++;
  }

  children.push(sectionHeader(`${secNum}. FASE ELIMINATORIA`));
  secNum++;
  let current = bracketSize;
  while (current >= 2) {
    if (current === 2) { children.push(bullet('Gran Final por el campeonato')); break; }
    if (current === 4) {
      children.push(bullet(`Semifinales y definición del 3er lugar (${current} jugadores)`));
    } else {
      const ronda = current === 8 ? 'Cuartos' : current === 16 ? 'Octavos' : current === 32 ? 'Dieciseisavos' : `Ronda de ${current}`;
      children.push(bullet(`${ronda} de final (${current} jugadores)`));
    }
    current = current / 2;
  }

  children.push(sectionHeader(`${secNum}. MODALIDAD DE JUEGO`));
  secNum++;
  children.push(bullet(`Grupos/Eliminatorias: ${inningsGroups} carambolas (Tope ${inningsGroups + 10} entradas)`));
  children.push(bullet(`Gran Final: ${inningsGroups + 5} carambolas (Sin límite de entradas)`));
  children.push(bullet(`Sistema: ${sistemaText}`));

  children.push(sectionHeader(`${secNum}. INFRAESTRUCTURA Y CRONOGRAMA`));
  children.push(bullet(`${tables} mesas oficiales disponibles. Grupos en ${turns} turno${turns > 1 ? 's' : ''} rotativo${turns > 1 ? 's' : ''}.`));
  children.push(bullet('Programación sujeta a Director de Torneo.'));

  // ---- PREMIACIÓN ----
  children.push(sectionHeader('PREMIOS EN DINERO'));
  const prizes = cfg.prizeDistribution && Array.isArray(cfg.prizeDistribution) ? cfg.prizeDistribution : [
    { label: '1°', percentage: 35 },
    { label: '2°', percentage: 25 },
    { label: '3° y 4°', percentage: '12 c/u' },
    { label: '5° al 8°', percentage: '4 c/u' },
  ];
  prizes.forEach((p: any) => children.push(bullet(`${p.label}: ${p.percentage}%`)));

  // ---- REGLAS GENERALES ----
  children.push(sectionHeader('REGLAS GENERALES'));
  [
    'Puntualidad: 10 min de espera antes de W.O.',
    'Vestimenta: Uniforme Clase B (Polo club, pantalón de vestir, zapatos negros)',
    'Conducta: Prohibido fumar o asistir bajo influencia de alcohol/drogas',
    'Desempates: PGP > Carambolas > Resultado Directo',
  ].forEach(r => children.push(bullet(r)));

  const doc = new Document({
    sections: [{ children }],
    title: `Bases - ${tournament.name}`,
    creator: 'FECHILLAR SGF',
  });

  const buffer = await Packer.toBuffer(doc);
  const safeName = tournament.name.replace(/[^a-zA-Z0-9_-]/g, '_');

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Bases_${safeName}.docx"`,
    },
  });
}
