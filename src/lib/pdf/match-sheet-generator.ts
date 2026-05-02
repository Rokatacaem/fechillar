import { jsPDF } from 'jspdf';
import { Match, PlayerProfile } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface MatchWithPlayers extends Match {
  homePlayer: PlayerProfile | null;
  awayPlayer: PlayerProfile | null;
  tournament?: { name: string; discipline: string; category: string };
  group?: { name: string } | null;
}

export async function generateMatchSheetsPDF(matches: MatchWithPlayers[]): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const margin = 10;
  const pageWidth = 215.9;
  const contentWidth = pageWidth - (margin * 2);

  // Cargar logos (Base64)
  const logoDir = path.join(process.cwd(), 'public/assets/logos');
  const getLogoBase64 = (filename: string) => {
    try {
      const filePath = path.join(logoDir, filename);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filename).replace('.', '');
        const data = fs.readFileSync(filePath).toString('base64');
        return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${data}`;
      }
    } catch (e) {
      console.error(`Error cargando logo ${filename}:`, e);
    }
    return null;
  };

  const imgFechillar = getLogoBase64('fechillar.png');
  const imgSantiago = getLogoBase64('club santiago.jpg');
  const imgIND = getLogoBase64('Instituto-nacional-de-deportes.png');

  matches.forEach((match, index) => {
    if (index > 0) doc.addPage();

    // ─── CABECERA TÉCNICA (REDiseñada para evitar solapamientos) ───
    const headerY = 5;
    
    // Logos con proporciones y posiciones fijas
    if (imgFechillar) doc.addImage(imgFechillar, 'PNG', margin, headerY, 28, 0, undefined, 'FAST');
    if (imgSantiago) doc.addImage(imgSantiago, 'JPEG', (pageWidth / 2) - 10, headerY, 20, 0, undefined, 'FAST'); // Centrado
    if (imgIND) doc.addImage(imgIND, 'PNG', pageWidth - margin - 35, headerY, 35, 0, undefined, 'FAST');

    // TÍTULO DEL TORNEO (CENTRAL)
    doc.setFontSize(14);
    doc.setTextColor(15, 63, 42); // Verde institucional oscuro
    doc.setFont('helvetica', 'bold');
    doc.text(match.tournament?.name?.toUpperCase() || 'TORNEO NACIONAL CLUB SANTIAGO', pageWidth / 2, 32, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Gris azulado
    doc.setFont('helvetica', 'normal');
    doc.text(`${match.tournament?.discipline || ''} - ${match.tournament?.category || ''} - FASE DE GRUPOS`, pageWidth / 2, 37, { align: 'center' });

    // INFORMACIÓN DE JUGADORES (EXTREMOS)
    const p1Name = match.homePlayer ? `${match.homePlayer.firstName} ${match.homePlayer.lastName}` : 'JUGADOR 1';
    const p2Name = match.awayPlayer ? `${match.awayPlayer.firstName} ${match.awayPlayer.lastName}` : 'JUGADOR 2';
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`JUGADOR 1: ${p1Name.toUpperCase()}`, margin, 46);
    doc.text(`JUGADOR 2: ${p2Name.toUpperCase()}`, pageWidth - margin, 46, { align: 'right' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(match.homePlayer?.tenantId ? 'Club Registrado' : 'Club Invitado', margin, 50); // Aquí se podría poner el nombre del club real si estuviera en el join
    doc.text(match.awayPlayer?.tenantId ? 'Club Registrado' : 'Club Invitado', pageWidth - margin, 50, { align: 'right' });

    // CAJA DE INFO (GRUPO / PARTIDO)
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    const infoWidth = 100;
    doc.roundedRect((pageWidth / 2) - (infoWidth / 2), 54, infoWidth, 8, 1, 1, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const infoText = `GRUPO: ${match.group?.name || 'A'}  |  PARTIDO: ${match.matchOrder || index + 1}  |  MESA: ____`;
    doc.text(infoText.toUpperCase(), pageWidth / 2, 59.5, { align: 'center' });

    // Separador Horizontal
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);

    // ─── BLOQUE DE ASIGNACIÓN DE BOLA ───
    const boxWidth = (contentWidth - 4) / 2;
    const yBoxes = 66;
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, yBoxes, boxWidth, 18, 1, 1, 'FD');
    doc.roundedRect(margin + boxWidth + 4, yBoxes, boxWidth, 18, 1, 1, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    
    doc.text('ASIGNACIÓN DE BOLA:', margin + 3, yBoxes + 5);
    doc.rect(margin + 50, yBoxes + 2, 8, 6); // Blanca
    doc.rect(margin + 50, yBoxes + 10, 8, 6); // Amarilla

    doc.text('ASIGNACIÓN DE BOLA:', margin + boxWidth + 7, yBoxes + 5);
    doc.rect(margin + boxWidth + 54, yBoxes + 2, 8, 6); 
    doc.rect(margin + boxWidth + 54, yBoxes + 10, 8, 6); 

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`META: ${match.homeTarget || '--'}`, margin + 3, yBoxes + 14);
    doc.text(`META: ${match.awayTarget || '--'}`, margin + boxWidth + 7, yBoxes + 14);

    // ─── TABLA DE ENTRADAS (CUADRÍCULA COMPLETA) ───
    let yTable = yBoxes + 22;
    const tableWidth = boxWidth;
    
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yTable, tableWidth, 6, 'FD');
    doc.rect(margin + boxWidth + 4, yTable, tableWidth, 6, 'FD');
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    const cols = [
        { label: 'ENT.', x: margin + 2 },
        { label: 'PARCIAL', x: margin + 11 },
        { label: 'TOTAL', x: margin + 38 },
        { label: 'ENT.', x: margin + boxWidth + 6 },
        { label: 'PARCIAL', x: margin + boxWidth + 15 },
        { label: 'TOTAL', x: margin + boxWidth + 42 }
    ];
    cols.forEach(c => doc.text(c.label, c.x, yTable + 4.2));

    yTable += 6;
    doc.setFont('helvetica', 'normal');
    
    // Filas de la tabla (Ajustado para que quepa en una sola hoja Carta)
    for (let i = 1; i <= 38; i++) {
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, yTable, 8, 4.5); 
      doc.rect(margin + 8, yTable, 25, 4.5); 
      doc.rect(margin + 33, yTable, tableWidth - 33, 4.5); 
      
      doc.rect(margin + boxWidth + 4, yTable, 8, 4.5); 
      doc.rect(margin + boxWidth + 4 + 8, yTable, 25, 4.5); 
      doc.rect(margin + boxWidth + 4 + 33, yTable, tableWidth - 33, 4.5); 
 
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(i.toString().padStart(2, '0'), margin + 1.5, yTable + 3.2);
      doc.text(i.toString().padStart(2, '0'), margin + boxWidth + 4 + 1.5, yTable + 3.2);
      
      yTable += 4.5;
    }

    // ─── RESUMEN FINAL ───
    yTable += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('RESULTADOS FINALES', pageWidth / 2, yTable, { align: 'center' });
    
    doc.setFillColor(15, 23, 42); 
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, yTable + 2, boxWidth, 18, 'F');
    doc.rect(margin + boxWidth + 4, yTable + 2, boxWidth, 18, 'F');

    doc.setFontSize(7);
    const metrics = ['CARAMBOLAS:', 'ENTRADAS:', 'SERIE MAYOR:'];
    metrics.forEach((m, i) => {
        const yLine = yTable + 6.5 + (i * 4.5);
        doc.text(m, margin + 4, yLine);
        doc.text('_________', margin + 30, yLine);
        
        doc.text(m, margin + boxWidth + 8, yLine);
        doc.text('_________', margin + boxWidth + 34, yLine);
    });

    // ─── FIRMAS ───
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    yTable += 26;
    const sigWidth = 50;
    doc.line(margin + 5, yTable, margin + 5 + sigWidth, yTable);
    doc.line(pageWidth - margin - 5 - sigWidth, yTable, pageWidth - margin - 5, yTable);
    doc.text('FIRMA JUGADOR 1', margin + 5 + (sigWidth / 2), yTable + 4, { align: 'center' });
    doc.text('FIRMA JUGADOR 2', pageWidth - margin - 5 - (sigWidth / 2), yTable + 4, { align: 'center' });

    doc.line(pageWidth / 2 - 25, yTable + 10, pageWidth / 2 + 25, yTable + 10);
    doc.text('FIRMA ÁRBITRO', pageWidth / 2, yTable + 14, { align: 'center' });
  });

  const pdfBlob = doc.output('arraybuffer');
  return Buffer.from(pdfBlob);
}
