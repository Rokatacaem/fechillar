import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, renderToStream } from '@react-pdf/renderer';
import QRCode from 'qrcode';

// Register custom fonts (Optional but highly recommended for a professional look)
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#10b981', // Emerald 500
    paddingBottom: 20,
    marginBottom: 30,
  },
  logoContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#0f172a', // Slate 900
    borderRadius: 8,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleContainer: {
    textAlign: 'right',
  },
  documentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 1,
  },
  documentSubtitle: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  playerSection: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  playerMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  metricCard: {
    width: '30%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    marginBottom: 15,
  },
  chartContainer: {
    marginBottom: 30,
  },
  chartImage: {
    width: '100%',
    height: 180,
    objectFit: 'contain',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 9,
    color: '#94a3b8',
    width: '70%',
  },
  qrContainer: {
    width: 60,
    height: 60,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  }
});

interface PlayerMetrics {
  playerId: string;
  name: string;
  average: string;
  highRun: number;
  totalScore: number;
  totalInnings: number;
  trendData: { date: string, pgp: number }[];
}

// React-PDF Document Component
const PlayerReport = ({ metrics, qrCodeUrl, chartUrl }: { metrics: PlayerMetrics, qrCodeUrl: string, chartUrl: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
            <Text style={styles.logoText}>FC</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.documentTitle}>FICHA DE RENDIMIENTO</Text>
          <Text style={styles.documentSubtitle}>Certificación Oficial Fechillar / WOR</Text>
        </View>
      </View>

      <View style={styles.playerSection}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{metrics.name.toUpperCase()}</Text>
          <Text style={styles.playerMeta}>ID Único: {metrics.playerId.toUpperCase()}</Text>
        </View>
      </View>

      <View>
          <Text style={styles.sectionTitle}>Métricas Compuestas</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>PGP Promedio</Text>
          <Text style={styles.metricValue}>{metrics.average}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>High Run (Serie)</Text>
          <Text style={styles.metricValue}>{metrics.highRun}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Carreras Totales</Text>
          <Text style={styles.metricValue}>{metrics.totalScore}</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Evolución de Rendimiento (Últimos 20 Eventos)</Text>
          {/* QuickChart.io Rasterized Image generated Server-Side */}
          {chartUrl && <Image src={chartUrl} style={styles.chartImage} />}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Documento generado digitalmente por el Sistema Base de FECHILLAR.
          Escanea el código QR para verificar la autenticidad de esta hoja de vida deportiva 
          en vivo dentro de la plataforma AutoLink.
        </Text>
        <View style={styles.qrContainer}>
          <Image src={qrCodeUrl} style={styles.qrImage} />
        </View>
      </View>

    </Page>
  </Document>
);

// Main Builder Function Exported for API Route
export async function generatePlayerReportPDF(metrics: PlayerMetrics) {
  // 1. Generate QR Code absolute URL verifiable string
  const verificationUrl = `https://autolink.cl/player/${metrics.playerId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      color: { dark: '#0f172a', light: '#ffffff' },
      margin: 1
  });

  // 2. Generate Chart.js URL via QuickChart API (Server-Side Serverless implementation)
  // Maps the TrendData array into a fast image API
  const labels = metrics.trendData.map(d => d.date.split("-").slice(1).join("/"));
  const dataPoints = metrics.trendData.map(d => d.pgp);
  
  const chartConfig = {
      type: 'line',
      data: {
          labels,
          datasets: [{
              label: 'PGP',
              data: dataPoints,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2
          }]
      },
      options: {
          plugins: { legend: { display: false } },
          scales: { y: { suggestedMin: 0.5 } }
      }
  };
  
  // QuickChart handles the encoding
  const chartUrl = `https://quickchart.io/chart?w=500&h=200&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

  // 3. Render PDF to Stream Buffer
  const pdfStream = await renderToStream(
      <PlayerReport metrics={metrics} qrCodeUrl={qrCodeDataUrl} chartUrl={chartUrl} />
  );

  return pdfStream;
}

// ============== TEMPLATE 2: CERTIFICADO DE AUSENCIA =================
const CertificateTemplate = ({ playerName, clubName, qrCodeUrl }: { playerName: string, clubName: string, qrCodeUrl: string }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
            <Text style={styles.logoText}>FC</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.documentTitle}>CERTIFICADO OFICIAL</Text>
          <Text style={styles.documentSubtitle}>Tribunal Federativo de Competición</Text>
        </View>
      </View>

      <View style={{ marginTop: 40, lineHeight: 1.5 }}>
        <Text style={{ fontSize: 13, color: '#0f172a', textAlign: 'justify' }}>
          Por la presente, el Directorio de Fechillar y el Tribunal Técnico de la plataforma certifican que el deportista:
        </Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981', marginVertical: 20, textAlign: 'center' }}>
          {playerName.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 13, color: '#0f172a', textAlign: 'justify' }}>
          Militante oficial del <Text style={{fontWeight:'bold'}}>{clubName}</Text>, se encuentra activo/a y convocado/a para disputar eventos competitivos dentro de nuestra jurisdicción federada durante la fecha en curso. 
        </Text>
        <Text style={{ fontSize: 13, color: '#0f172a', textAlign: 'justify', marginTop: 15 }}>
          Se expide este documento a petición del interesado para certificar su compromiso y participación en las justas deportivas oficiales, sirviendo como aval de inasistencia para instancias laborales o académicas amparado bajo los estatutos de deporte de competición.
        </Text>
      </View>

      <View style={{ marginTop: 80, borderTopWidth: 1, borderColor: '#e2e8f0', width: 200, alignSelf: 'center', paddingTop: 10 }}>
         <Text style={{ fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: '#0f172a' }}>Comité Ejecutivo</Text>
         <Text style={{ fontSize: 9, textAlign: 'center', color: '#64748b' }}>Firma Digital SGF</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Documento validado por Workflow SGF. Escanee el código QR para validar que esta firma digital sigue vigente en la base de datos nacional.
        </Text>
        <View style={styles.qrContainer}>
          <Image src={qrCodeUrl} style={styles.qrImage} />
        </View>
      </View>
    </Page>
  </Document>
);

// ============== TEMPLATE 3: CUADRO DE HONOR =================

const RANK_COLORS: Record<number, string> = { 1: '#ca8a04', 2: '#6b7280', 3: '#b45309' };
const RANK_BG:     Record<number, string> = { 1: '#fefce8', 2: '#f8fafc', 3: '#fff7ed' };

const StandingsTemplate = ({
    tournamentName,
    venueName,
    discipline,
    category,
    startDate,
    participants,
    fechillarLogoUrl,
    clubLogoUrl,
    indLogoUrl,
}: {
    tournamentName: string;
    venueName: string;
    discipline: string;
    category: string;
    startDate: string;
    participants: any[];
    fechillarLogoUrl: string;
    clubLogoUrl?: string;
    indLogoUrl?: string;
}) => {
    const sorted = [...participants].sort((a, b) => a.rank - b.rank);

    // Player with best particular average gets the star
    const bestPartAvg = Math.max(...sorted.map(p => p.particularAverage ?? 0));

    return (
      <Document>
        <Page size="A4" style={{ ...styles.page, paddingBottom: 60 }}>

          {/* ── Header: Fechillar + Club | Título | IND ── */}
          <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              borderBottomWidth: 3, borderBottomColor: '#1e3a8a',
              paddingBottom: 12, marginBottom: 8,
          }}>
            {/* Izquierda: Fechillar + Club organizador */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image src={fechillarLogoUrl} style={{ width: 65, height: 65 }} />
              {clubLogoUrl && <Image src={clubLogoUrl} style={{ width: 65, height: 65 }} />}
            </View>

            {/* Centro: Título */}
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e3a8a', letterSpacing: 2, textAlign: 'center' }}>
                CUADRO DE HONOR
              </Text>
              <Text style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 3, textAlign: 'center' }}>
                {tournamentName}
              </Text>
            </View>

            {/* Derecha: IND */}
            {indLogoUrl
              ? <Image src={indLogoUrl} style={{ width: 70, height: 70 }} />
              : <View style={{ width: 70 }} />
            }
          </View>

          {/* ── Sub-header: meta ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, backgroundColor: '#1e3a8a', padding: 8, borderRadius: 4 }}>
            <Text style={{ fontSize: 8, color: '#ffffff' }}>SEDE: {venueName.toUpperCase()}</Text>
            <Text style={{ fontSize: 8, color: '#ffffff' }}>{discipline} / {category}</Text>
            <Text style={{ fontSize: 8, color: '#ffffff' }}>{startDate}</Text>
            <Text style={{ fontSize: 8, color: '#ffffff' }}>CERTIFICACIÓN OFICIAL FECHILLAR</Text>
          </View>

          {/* ── Table ── */}
          <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, overflow: 'hidden' }}>

            {/* Table header */}
            <View style={{ flexDirection: 'row', backgroundColor: '#1e3a8a', padding: 7 }}>
              <Text style={{ width: '8%',  fontSize: 8, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>POS</Text>
              <Text style={{ width: '32%', fontSize: 8, fontWeight: 'bold', color: '#ffffff' }}>DEPORTISTA</Text>
              <Text style={{ width: '24%', fontSize: 8, fontWeight: 'bold', color: '#ffffff' }}>CLUB</Text>
              <Text style={{ width: '15%', fontSize: 8, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>PROM. GRAL</Text>
              <Text style={{ width: '15%', fontSize: 8, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>MEJOR TACADA</Text>
              <Text style={{ width: '6%',  fontSize: 8, fontWeight: 'bold', color: '#fbbf24',  textAlign: 'center' }}>★</Text>
            </View>

            {/* Data rows */}
            {sorted.map((p, i) => {
                const isTop3  = p.rank <= 3;
                const hasStar = bestPartAvg > 0 && (p.particularAverage ?? 0) === bestPartAvg;
                const rowBg   = isTop3 ? (RANK_BG[p.rank] ?? '#f0f9ff') : (i % 2 === 0 ? '#ffffff' : '#f8fafc');
                const nameColor = isTop3 ? (RANK_COLORS[p.rank] ?? '#0f172a') : '#0f172a';
                return (
                  <View key={p.id ?? i} style={{ flexDirection: 'row', backgroundColor: rowBg, paddingVertical: 6, paddingHorizontal: 7, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                    <Text style={{ width: '8%',  fontSize: 9, fontWeight: isTop3 ? 'bold' : 'normal', color: nameColor, textAlign: 'center' }}>
                      {p.rank}°
                    </Text>
                    <Text style={{ width: '32%', fontSize: 9, fontWeight: isTop3 ? 'bold' : 'normal', color: nameColor }}>
                      {(p.name ?? '').toUpperCase()}
                    </Text>
                    <Text style={{ width: '24%', fontSize: 8, color: '#475569' }}>
                      {p.club ?? '—'}
                    </Text>
                    <Text style={{ width: '15%', fontSize: 9, color: '#0f172a', textAlign: 'center', fontWeight: 'bold' }}>
                      {p.generalAverage != null ? p.generalAverage.toFixed(3) : '—'}
                    </Text>
                    <Text style={{ width: '15%', fontSize: 9, color: '#0f172a', textAlign: 'center' }}>
                      {p.highRun ?? '—'}
                    </Text>
                    <Text style={{ width: '6%',  fontSize: 11, color: '#f59e0b', textAlign: 'center' }}>
                      {hasStar ? '★' : ''}
                    </Text>
                  </View>
                );
            })}
          </View>

          {/* ── Legend ── */}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
            <Text style={{ fontSize: 7, color: '#64748b' }}>★ Mejor promedio particular del torneo</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>  Prom. Gral = Total carambolas / Total entradas</Text>
          </View>

          {/* ── Footer ── */}
          <View style={{ position: 'absolute', bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 7, color: '#94a3b8' }}>
              Documento oficial — Federación Chilena de Juegos de Billar (FECHILLAR)
            </Text>
            <Text style={{ fontSize: 7, color: '#94a3b8' }}>
              Generado: {new Date().toLocaleDateString('es-CL')}
            </Text>
          </View>

        </Page>
      </Document>
    );
};

export async function generateTournamentStandingsPDF(
    tournament: any,
    participants: any[],
    fechillarLogoUrl: string,
    clubLogoUrl?: string,
    indLogoUrl?: string,
) {
    const startDate = tournament.startDate
        ? new Date(tournament.startDate).toLocaleDateString('es-CL')
        : '';

    return await renderToStream(
        <StandingsTemplate
            tournamentName={tournament.name}
            venueName={tournament.venue || tournament.venueClub?.name || 'Por confirmar'}
            discipline={tournament.discipline ?? ''}
            category={tournament.category ?? ''}
            startDate={startDate}
            participants={participants}
            fechillarLogoUrl={fechillarLogoUrl}
            clubLogoUrl={clubLogoUrl}
            indLogoUrl={indLogoUrl}
        />
    );
}
