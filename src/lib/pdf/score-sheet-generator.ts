import jsPDF from 'jspdf';

export interface ScoreSheetData {
    tournamentTitle: string;
    clubSede: string;
    phase: string;
    player1: { name: string; club: string };
    player2: { name: string; club: string };
    group: string;
    matchNo: string;
    tableNo: string;
}

export const generateScoreSheetPDF = async (dataList: ScoreSheetData[]) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10; 

    const primaryColor = [26, 77, 46]; // Verde Institucional

    const addLogoProportional = (url: string, x: number, y: number, w: number, maxH: number, align: 'left' | 'center' | 'right' = 'left') => {
        try {
            // Usamos 0 en height para que jsPDF mantenga el ratio automáticamente
            let posX = x;
            if (align === 'center') posX = x - w / 2;
            if (align === 'right') posX = x - w;
            
            // Para centrado vertical "visual", estimamos que la mayoría de los logos
            // tienen un ratio similar, pero el del IND es más ancho.
            // Si h es 0, jsPDF lo escala. Ponemos un y un poco más abajo para logos anchos.
            const isIND = url.includes('Instituto-nacional-de-deportes');
            const yOffset = isIND ? 2 : 0; 

            doc.addImage(url, 'PNG', posX, y + yOffset, w, 0);
        } catch (e) {
            try {
                let posX = x;
                if (align === 'center') posX = x - w / 2;
                if (align === 'right') posX = x - w;
                doc.addImage(url, 'JPEG', posX, y, w, 0);
            } catch (e2) {
                console.warn(`Could not load logo: ${url}`, e2);
            }
        }
    };

    for (let i = 0; i < dataList.length; i++) {
        if (i > 0) doc.addPage();
        
        const data = dataList[i];

        // 1. LOGOS (Triple Identidad con Proporción Preservada)
        const headerY = margin;
        const maxH = 18;
        addLogoProportional('/assets/logos/fechillar.png', margin, headerY, 22, maxH, 'left');
        addLogoProportional('/assets/logos/club santiago.jpg', pageWidth / 2, headerY, 18, maxH, 'center');
        addLogoProportional('/assets/logos/Instituto-nacional-de-deportes.png', pageWidth - margin, headerY, 32, maxH, 'right');

        // 2. TOURNAMENT INFO
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(data.tournamentTitle.toUpperCase(), pageWidth / 2, margin + 22, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(`${data.clubSede} - ${data.phase.toUpperCase()}`, pageWidth / 2, margin + 28, { align: 'center' });

        // 3. PLAYER INFO SECTION
        const infoY = margin + 35;
        
        // Player 1 Box
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(`JUGADOR 1: ${data.player1.name.toUpperCase()}`, margin, infoY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(data.player1.club, margin, infoY + 4);

        // Player 2 Box
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`JUGADOR 2: ${data.player2.name.toUpperCase()}`, pageWidth - margin, infoY, { align: 'right' });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(data.player2.club, pageWidth - margin, infoY + 4, { align: 'right' });

        // MID INFO
        doc.setFillColor(245, 245, 245);
        doc.rect(pageWidth / 2 - 45, infoY + 6, 90, 7, 'F');
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`GRUPO: ${data.group}   |   PARTIDO: ${data.matchNo}   |   MESA: ${data.tableNo}`, pageWidth / 2, infoY + 11, { align: 'center' });

        // 4. MATRIZ DE ANOTACIÓN (35 entradas)
        const tableStartY = infoY + 16;
        const colWidth = (pageWidth - 2 * margin - 10) / 2; 
        const rowHeight = 4.3; 
        
        const drawScoreMatrix = (startX: number, isYellow: boolean) => {
            // Header de Bola
            if (isYellow) {
                doc.setFillColor(255, 255, 200); 
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.rect(startX, tableStartY, colWidth, rowHeight * 2, 'F');
                doc.setTextColor(0);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text("", startX + colWidth / 2, tableStartY + 5.5, { align: 'center' });
            } else {
                doc.setFillColor(255, 255, 255); 
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.rect(startX, tableStartY, colWidth, rowHeight * 2, 'FD');
                doc.setTextColor(0);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text("", startX + colWidth / 2, tableStartY + 5.5, { align: 'center' });
            }

            const subHeaderY = tableStartY + rowHeight * 2;
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(startX, subHeaderY, colWidth, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            const w1 = colWidth * 0.2; 
            const w2 = colWidth * 0.4; 
            const w3 = colWidth * 0.4; 
            
            doc.text("ENT", startX + w1 / 2, subHeaderY + 3, { align: 'center' });
            doc.text("PARCIAL", startX + w1 + w2 / 2, subHeaderY + 3, { align: 'center' });
            doc.text("TOTAL", startX + w1 + w2 + w3 / 2, subHeaderY + 3, { align: 'center' });

            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            doc.setDrawColor(180);
            for (let r = 1; r <= 35; r++) {
                const rowY = subHeaderY + r * rowHeight;
                doc.rect(startX, rowY, w1, rowHeight);
                doc.rect(startX + w1, rowY, w2, rowHeight);
                doc.rect(startX + w1 + w2, rowY, w3, rowHeight);
                doc.setFontSize(7);
                doc.text(r.toString(), startX + w1 / 2, rowY + 3, { align: 'center' });
            }

            const footerY = subHeaderY + 36 * rowHeight;
            const footerLabels = ["TOTAL", "ENTRADAS", "S. MAYOR"];
            footerLabels.forEach((label, idx) => {
                const fy = footerY + idx * rowHeight;
                doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.rect(startX, fy, w1 + w2, rowHeight, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.text(label, startX + (w1 + w2) / 2, fy + 3, { align: 'center' });
                doc.setTextColor(0, 0, 0);
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.rect(startX + w1 + w2, fy, w3, rowHeight);
            });
        };

        drawScoreMatrix(margin, false); 
        drawScoreMatrix(pageWidth / 2 + 5, true); 

        const sigY = pageHeight - margin - 12;
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        
        doc.line(margin + 10, sigY, margin + 70, sigY);
        doc.line(pageWidth - margin - 70, sigY, pageWidth - margin - 10, sigY);
        
        doc.setFontSize(9);
        doc.setTextColor(50);
        doc.setFont("helvetica", "bold");
        doc.text("FIRMA JUGADOR 1", margin + 40, sigY + 5, { align: 'center' });
        doc.text("FIRMA JUGADOR 2", pageWidth - margin - 40, sigY + 5, { align: 'center' });
        
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text("Sistema de Gestión de Billar Fechillar v2.0 - Planilla Oficial de Competencia", pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    doc.save(`Planillas_${dataList[0]?.phase.replace(/\s+/g, '_') || 'Torneo'}.pdf`);
};
