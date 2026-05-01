import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToStream,
} from '@react-pdf/renderer';

// ─────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 36,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  // Header con logos
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0f2040',
    paddingBottom: 14,
    marginBottom: 16,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoFechillar: {
    width: 48,
    height: 48,
    objectFit: 'contain',
  },
  logoInd: {
    width: 70,
    height: 48,
    objectFit: 'contain',
  },
  headerText: {
    alignItems: 'flex-end',
  },
  titleMain: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f2040',
    letterSpacing: 1,
  },
  titleSub: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 3,
  },
  // Metadata del informe
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: '8 12',
    marginBottom: 14,
  },
  metaLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  metaValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 2 },
  // Tabla
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f2040',
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowAlt: {
    backgroundColor: '#f8fafc',
  },
  rowTop3: {
    backgroundColor: '#f0fdf4',
  },
  cell: {
    fontSize: 9,
    color: '#334155',
  },
  cellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  cellAccent: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#10b981',
  },
  // Pie de página
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: '#94a3b8' },
  footerPage: { fontSize: 7, color: '#94a3b8' },
});

// ─────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────
export interface RankingRow {
  position: number;
  firstName: string;
  lastName: string;
  clubName: string;
  rankPosition: number | null;
  average: number | null;
  handicapTarget: number | null;
  points: number;
}

export interface RankingReportData {
  discipline: 'THREE_BAND' | 'THREE_BAND_ANNUAL';
  generatedAt: string;
  rows: RankingRow[];
  fechillarLogoPath: string;
  indLogoPath: string;
}

// ─────────────────────────────────────────────────────────
// WIDTHS
// ─────────────────────────────────────────────────────────
const COL = {
  pos:    '7%',
  name:   '32%',
  club:   '26%',
  rank:   '10%',
  avg:    '13%',
  hdcp:   '8%',
  pts:    '9%',        // solo Nacional
  avgAnn: '17%',      // solo Anual — más ancho sin hdcp
  ptsAnn: '9%',
};

// ─────────────────────────────────────────────────────────
// COMPONENTE DOCUMENTO
// ─────────────────────────────────────────────────────────
const RankingReport = ({ data }: { data: RankingReportData }) => {
  const isAnnual = data.discipline === 'THREE_BAND_ANNUAL';
  const title = isAnnual ? 'RANKING ANUAL' : 'RANKING NACIONAL';
  const subtitle = isAnnual
    ? 'Carambola a Tres Bandas — Sin Handicap'
    : 'Carambola a Tres Bandas — Handicap Oficial';

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoGroup}>
            <Image src={data.fechillarLogoPath} style={styles.logoFechillar} />
            <Image src={data.indLogoPath} style={styles.logoInd} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.titleMain}>{title}</Text>
            <Text style={styles.titleSub}>
              Federación Chilena de Billar — FECHILLAR
            </Text>
            <Text style={[styles.titleSub, { color: '#10b981', marginTop: 1 }]}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* METADATA */}
        <View style={styles.meta}>
          <View>
            <Text style={styles.metaLabel}>Total Jugadores</Text>
            <Text style={styles.metaValue}>{data.rows.length}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Actualizado</Text>
            <Text style={styles.metaValue}>{data.generatedAt}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Categoría</Text>
            <Text style={styles.metaValue}>MÁSTER</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Temporada</Text>
            <Text style={styles.metaValue}>2026</Text>
          </View>
        </View>

        {/* TABLA HEADER */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: COL.pos }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { width: COL.name }]}>Deportista</Text>
          <Text style={[styles.tableHeaderCell, { width: COL.club }]}>Club</Text>
          <Text style={[styles.tableHeaderCell, { width: COL.rank, textAlign: 'center' }]}>Pos.</Text>
          <Text style={[styles.tableHeaderCell, { width: isAnnual ? COL.avgAnn : COL.avg, textAlign: 'center' }]}>Promedio</Text>
          {!isAnnual && (
            <Text style={[styles.tableHeaderCell, { width: COL.hdcp, textAlign: 'center' }]}>Hdcp</Text>
          )}
          <Text style={[styles.tableHeaderCell, { width: isAnnual ? COL.ptsAnn : COL.pts, textAlign: 'right' }]}>Pts</Text>
        </View>

        {/* FILAS */}
        {data.rows.map((row, idx) => {
          const isTop3 = idx < 3;
          const isAltRow = idx % 2 === 1;
          const rowStyle = isTop3
            ? [styles.row, styles.rowTop3]
            : isAltRow
            ? [styles.row, styles.rowAlt]
            : [styles.row];

          return (
            <View key={idx} style={rowStyle}>
              <Text style={[styles.cellBold, { width: COL.pos, color: isTop3 ? '#10b981' : '#64748b' }]}>
                {idx + 1}
              </Text>
              <Text style={[styles.cellBold, { width: COL.name }]}>
                {row.firstName.toUpperCase()} {row.lastName.toUpperCase()}
              </Text>
              <Text style={[styles.cell, { width: COL.club }]}>
                {row.clubName || '—'}
              </Text>
              <Text style={[styles.cell, { width: COL.rank, textAlign: 'center' }]}>
                {row.rankPosition && row.rankPosition < 999 ? `#${row.rankPosition}` : '—'}
              </Text>
              <Text style={[styles.cellAccent, { width: isAnnual ? COL.avgAnn : COL.avg, textAlign: 'center' }]}>
                {row.average != null ? row.average.toFixed(3) : '—'}
              </Text>
              {!isAnnual && (
                <Text style={[styles.cell, { width: COL.hdcp, textAlign: 'center' }]}>
                  {row.handicapTarget ?? '—'}
                </Text>
              )}
              <Text style={[styles.cellBold, { width: isAnnual ? COL.ptsAnn : COL.pts, textAlign: 'right' }]}>
                {row.points}
              </Text>
            </View>
          );
        })}

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Documento oficial generado por el Sistema de Gestión Federativa (SGF) — FECHILLAR · IND
          </Text>
          <Text style={styles.footerPage} render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  );
};

// ─────────────────────────────────────────────────────────
// FUNCIÓN EXPORTADA
// ─────────────────────────────────────────────────────────
export async function generateRankingReportPDF(data: RankingReportData) {
  return await renderToStream(<RankingReport data={data} />);
}
