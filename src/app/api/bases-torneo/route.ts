import { NextRequest, NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ImageRun,
  ShadingType, TableLayoutType, convertInchesToTwip, PageOrientation,
  Header, Footer, PageNumber, NumberFormat,
} from "docx";

function fmt(n: number) {
  return n.toLocaleString("es-CL");
}

function fechaLarga(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${dias[date.getDay()].charAt(0).toUpperCase() + dias[date.getDay()].slice(1)} ${d} de ${meses[m-1]} de ${y}`;
}

function h2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
  });
}

function h3(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
  });
}

function p(text: string, opts: { bold?: boolean; size?: number; center?: boolean; color?: string } = {}): Paragraph {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size ?? 22,
        color: opts.color,
      }),
    ],
  });
}

function headerCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20 })],
    })],
    shading: { type: ShadingType.CLEAR, fill: "D5E8F0" },
  });
}

function dataCell(text: string, right = false): TableCell {
  return new TableCell({
    children: [new Paragraph({
      alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: [new TextRun({ text, size: 20 })],
    })],
  });
}

function twoColTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })],
          shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
        }),
      ],
    })),
    layout: TableLayoutType.FIXED,
  });
}

function spacer(): Paragraph {
  return new Paragraph({ text: "", spacing: { after: 160 } });
}

export async function POST(req: NextRequest) {
  try {
    const d = await req.json();

    // Calcular pozo total y montos de premios
    const pozoTotal = (d.sede?.capacidad_maxima ?? 0) * (d.fondos?.monto_premios ?? 0);
    const pcts = d.premios ?? {};
    const puestos: [string, number][] = [
      ["1er lugar", pcts.premio_1ro ?? 35],
      ["2do lugar", pcts.premio_2do ?? 25],
      ["3er lugar", pcts.premio_3ro ?? 12],
      ["4to lugar", pcts.premio_4to ?? 12],
      ["5to-6to lugar", (pcts.premio_5to ?? 4) + (pcts.premio_6to ?? 4)],
      ["7mo-8vo lugar", (pcts.premio_7mo ?? 4) + (pcts.premio_8vo ?? 4)],
    ];

    const ig = d.informacion_general ?? {};
    const sede = d.sede ?? {};
    const insc = d.inscripcion ?? {};
    const banco = d.datos_bancarios ?? {};
    const fmt2 = d.formato_torneo ?? {};
    const grupos = fmt2.fase_grupos ?? {};
    const playoff = fmt2.playoff ?? {};
    const elim = fmt2.eliminatoria ?? {};
    const reglas = d.reglas_juego ?? {};
    const fondos = d.fondos ?? {};
    const vest = d.vestimenta ?? {};
    const prog = d.programacion ?? {};
    const servicios = d.servicios ?? {};
    const contacto = d.contacto ?? {};
    const desempate = d.desempate ?? {};
    const sanciones = d.sanciones ?? {};

    const dia1 = prog.dia1 ?? {};
    const dia2 = prog.dia2 ?? {};

    const children: any[] = [];

    // TÍTULO
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: ig.nombre_torneo ?? "TORNEO DE BILLAR", bold: true, size: 36, allCaps: true })],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: `MODALIDAD ${(ig.modalidad ?? "").toUpperCase()}`, bold: true, size: 26 })],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: `${fechaLarga(ig.fecha_inicio)} al ${fechaLarga(ig.fecha_fin)}`, size: 22, italics: true })],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: `📍 ${sede.nombre_sede} · ${sede.direccion_sede}`, size: 22 })],
    }));
    children.push(spacer());

    // 1. ORGANIZACIÓN
    children.push(h2("1. ORGANIZACIÓN"));
    children.push(twoColTable([
      ["Entidad Organizadora", contacto.entidad_organizadora ?? "FECHILLAR"],
      ["Director del Torneo", contacto.director_torneo ?? "Designado por FECHILLAR"],
      ["Email de Contacto", contacto.email_organizador ?? ""],
      ["Colaboradores", Array.isArray(contacto.colaboradores) ? contacto.colaboradores.join(", ") : (contacto.colaboradores ?? "")],
    ]));
    children.push(spacer());

    // 2. SEDE
    children.push(h2("2. SEDE DEL TORNEO"));
    children.push(twoColTable([
      ["Nombre del Club", sede.nombre_sede ?? ""],
      ["Dirección", sede.direccion_sede ?? ""],
      ["N° de Mesas", String(sede.numero_mesas ?? "")],
      ["Turnos Rotativos", String(sede.turnos_rotativos ?? "")],
      ["Capacidad Máxima", `${sede.capacidad_maxima ?? ""} jugadores`],
    ]));
    children.push(spacer());

    // 3. INSCRIPCIÓN Y PAGO
    children.push(h2("3. INSCRIPCIÓN Y PAGO"));
    children.push(twoColTable([
      ["Valor Inscripción", `$${fmt(insc.valor_inscripcion ?? 0)} CLP`],
      ["Cupos Disponibles", String(insc.cupos_maximos ?? sede.capacidad_maxima ?? "")],
      ["Plazo de Inscripción", insc.plazo_inscripcion ?? ""],
    ]));
    children.push(spacer());
    children.push(h3("Datos para Transferencia"));
    children.push(twoColTable([
      ["Beneficiario", banco.beneficiario ?? ""],
      ["RUT", banco.rut_beneficiario ?? ""],
      ["Banco", banco.banco ?? ""],
      ["Tipo de Cuenta", banco.tipo_cuenta ?? ""],
      ["N° de Cuenta", banco.numero_cuenta ?? ""],
      ["Email comprobante", banco.email_contacto ?? ""],
    ]));
    children.push(spacer());

    // 4. FORMATO DEL TORNEO
    children.push(h2("4. FORMATO DEL TORNEO"));

    children.push(h3("4.1 Fase de Grupos"));
    children.push(twoColTable([
      ["Cantidad de Grupos", String(grupos.cantidad_grupos ?? "")],
      ["Jugadores por Grupo", String(grupos.jugadores_por_grupo ?? "")],
      ["Sistema de Grupos", grupos.sistema_grupos === "round-robin" ? "Round-Robin (todos contra todos)" : "Sistema Suizo"],
      ["Clasificados por Grupo", String(grupos.clasificados_por_grupo ?? "")],
      ["Total Clasificados", String((grupos.cantidad_grupos ?? 0) * (grupos.clasificados_por_grupo ?? 0))],
    ]));

    if (playoff.tiene_playoff) {
      children.push(spacer());
      children.push(h3("4.2 Fase de Ajuste (Playoff)"));
      children.push(twoColTable([
        ["Clasificación directa hasta puesto", String(playoff.clasificacion_directa_hasta ?? "")],
        ["Cupos en disputa en playoff", String(playoff.cupos_playoff ?? "")],
      ]));
    }

    children.push(spacer());
    children.push(h3(`${playoff.tiene_playoff ? "4.3" : "4.2"} Fase Eliminatoria`));
    children.push(twoColTable([
      ["Tipo de Eliminatoria", elim.tipo_eliminatoria === "doble" ? "Doble Eliminación" : "Eliminación Simple"],
      ["Jugadores en Llave Inicial", String(elim.jugadores_llave_inicial ?? "")],
      ["Partido por 3er Lugar", elim.tiene_tercer_lugar ? "Sí" : "No"],
    ]));
    children.push(spacer());

    // 5. MODALIDAD DE JUEGO
    children.push(h2("5. MODALIDAD DE JUEGO"));
    const handicapTexto: Record<string, string> = {
      sin_handicap: "Sin Hándicap",
      con_handicap: "Con Hándicap",
      nacional: "Sistema Nacional de Hándicap",
    };
    children.push(p(`Disciplina: ${ig.modalidad ?? ""} · Hándicap: ${handicapTexto[ig.tipo_handicap ?? ""] ?? ig.tipo_handicap ?? ""}`));
    children.push(spacer());

    // Tabla reglas
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            headerCell("Fase"),
            headerCell("Carambolas"),
            headerCell("Tope Entradas"),
          ],
          tableHeader: true,
        }),
        new TableRow({
          children: [
            dataCell("Fase de Grupos"),
            dataCell(String(reglas.carambolas_grupos ?? 25), true),
            dataCell(reglas.entradas_grupos === 0 ? "Sin límite" : String(reglas.entradas_grupos ?? 35), true),
          ],
        }),
        new TableRow({
          children: [
            dataCell("Fase Eliminatoria"),
            dataCell(String(reglas.carambolas_eliminatorias ?? 25), true),
            dataCell(reglas.entradas_eliminatorias === 0 ? "Sin límite" : String(reglas.entradas_eliminatorias ?? 35), true),
          ],
        }),
        new TableRow({
          children: [
            dataCell("Gran Final"),
            dataCell(String(reglas.carambolas_final ?? 30), true),
            dataCell(reglas.entradas_final === 0 ? "Sin límite" : String(reglas.entradas_final ?? 0), true),
          ],
        }),
      ],
    }));
    children.push(spacer());

    // 6. DISTRIBUCIÓN DE FONDOS
    children.push(h2("6. DISTRIBUCIÓN DE FONDOS"));
    const rowsFondos: [string, string][] = [
      ["Inscripción por jugador", `$${fmt(insc.valor_inscripcion ?? 0)} CLP`],
      ["Aporte a premios", `$${fmt(fondos.monto_premios ?? 0)} CLP`],
      ["Mesa técnica / Trofeos", `$${fmt(fondos.monto_mesa_tecnica ?? 0)} CLP`],
    ];
    if (fondos.tiene_fondo_especial) {
      rowsFondos.push([fondos.nombre_fondo_especial ?? "Fondo Especial", `$${fmt(fondos.monto_fondo_especial ?? 0)} CLP`]);
    }
    rowsFondos.push(["Pozo total estimado de premios", `$${fmt(pozoTotal)} CLP`]);
    children.push(twoColTable(rowsFondos));
    children.push(spacer());

    children.push(h3("Distribución de Premios"));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [headerCell("Posición"), headerCell("Porcentaje"), headerCell("Monto estimado")],
          tableHeader: true,
        }),
        ...puestos.map(([pos, pct]) => new TableRow({
          children: [
            dataCell(pos),
            dataCell(`${pct}%`, true),
            dataCell(`$${fmt(Math.round(pozoTotal * pct / 100))} CLP`, true),
          ],
        })),
      ],
    }));
    children.push(spacer());

    // 7. CÓDIGO DE VESTIMENTA
    children.push(h2(`7. CÓDIGO DE VESTIMENTA (${vest.tipo_uniforme ?? "Clase B"})`));
    children.push(twoColTable([
      ["Prenda Superior", vest.descripcion_superior ?? ""],
      ["Pantalón", vest.descripcion_pantalon ?? ""],
      ["Calzado", vest.descripcion_calzado ?? ""],
    ]));
    children.push(spacer());

    // 8. PROGRAMACIÓN
    children.push(h2("8. PROGRAMACIÓN DEL EVENTO"));
    children.push(h3(`Día 1 — ${fechaLarga(ig.fecha_inicio)}`));

    const rowsProg1: [string, string][] = [
      ["Acreditación", `${dia1.acreditacion_inicio ?? ""} — ${dia1.acreditacion_fin ?? ""} hrs`],
      ["Fase de Grupos", `${dia1.grupos_inicio ?? ""} — ${dia1.grupos_fin ?? ""} hrs`],
    ];
    if (playoff.tiene_playoff && dia1.playoff_inicio) {
      rowsProg1.push(["Fase de Ajuste (Playoff)", `${dia1.playoff_inicio} — ${dia1.playoff_fin ?? ""} hrs`]);
    }
    children.push(twoColTable(rowsProg1));

    children.push(spacer());
    children.push(h3(`Día 2 — ${fechaLarga(ig.fecha_fin)}`));

    const rowsProg2: [string, string][] = [];
    if ((elim.jugadores_llave_inicial ?? 0) >= 32 && dia2.dieciseisavos_inicio) {
      rowsProg2.push(["Dieciseisavos / Octavos", `${dia2.dieciseisavos_inicio} — ${dia2.dieciseisavos_fin ?? ""} hrs`]);
    }
    rowsProg2.push(
      ["Cuartos de Final", `${dia2.cuartos_inicio ?? ""} — ${dia2.cuartos_fin ?? ""} hrs`],
      ["Semifinales", `${dia2.semifinales_inicio ?? ""} — ${dia2.semifinales_fin ?? ""} hrs`],
      ["Gran Final 🏆", `${dia2.final_inicio ?? ""} — ${dia2.final_fin ?? ""} hrs`],
    );
    children.push(twoColTable(rowsProg2));
    children.push(spacer());

    // 9. CRITERIOS DE DESEMPATE
    children.push(h2("9. CRITERIOS DE DESEMPATE"));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [headerCell("Prioridad"), headerCell("Criterio")],
          tableHeader: true,
        }),
        ...[
          desempate.criterio_1 ?? "Puntos",
          desempate.criterio_2 ?? "Promedio General (PGP)",
          desempate.criterio_3 ?? "Promedio Particular",
          desempate.criterio_4 ?? "Mejor Tacada",
          desempate.criterio_5 ?? "Orden Cronológico de Mejor Tacada",
        ].map((criterio, i) => new TableRow({
          children: [dataCell(`${i + 1}°`), dataCell(criterio)],
        })),
      ],
    }));
    children.push(spacer());

    // 10. SERVICIOS
    children.push(h2("10. SERVICIOS Y FACILIDADES"));
    const rowsServ: [string, string][] = [
      ["Cafetería", servicios.tiene_cafeteria ? "✓ Disponible" : "No disponible"],
      ["Estacionamiento", servicios.estacionamiento ?? "Limitado"],
      ["Wi-Fi Gratuito", servicios.tiene_wifi ? "✓ Disponible" : "No disponible"],
      ["Transmisión en Vivo", servicios.tiene_transmision ? `✓ ${servicios.plataforma_transmision ?? "Por confirmar"}` : "No"],
    ];
    children.push(twoColTable(rowsServ));
    children.push(spacer());

    // 11. SANCIONES
    children.push(h2("11. SANCIONES"));
    children.push(twoColTable([
      ["Tolerancia de retraso", `${sanciones.tolerancia_retraso_minutos ?? 10} minutos`],
      ["Sanción por retraso", sanciones.sancion_retraso ?? "W.O. después de 10 minutos"],
      ["Sanción por vestimenta", sanciones.sancion_vestimenta ?? "Advertencia / No permitir jugar"],
    ]));
    children.push(spacer());

    // FIRMA
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [new TextRun({ text: "___________________________________", size: 22 })],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: contacto.entidad_organizadora ?? "FECHILLAR", bold: true, size: 22 })],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Federación Chilena de Billar", size: 20, italics: true })],
    }));

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Arial", size: 22 },
          },
        },
        paragraphStyles: [
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            run: { bold: true, size: 28, color: "1a365d" },
            paragraph: {
              spacing: { before: 300, after: 120 },
              border: { bottom: { color: "D5E8F0", style: BorderStyle.SINGLE, size: 6 } },
            },
          },
          {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            run: { bold: true, size: 24, color: "2d5a8e" },
            paragraph: { spacing: { before: 200, after: 80 } },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Bases_Torneo_${(sede.nombre_sede ?? "torneo").replace(/\s+/g, "_")}_${ig.año_evento ?? new Date().getFullYear()}.docx"`,
      },
    });
  } catch (err: any) {
    console.error("Error generando documento:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
