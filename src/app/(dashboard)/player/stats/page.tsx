"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

// Mock Data Load (En producción sería fetch /api/analytics)
const MOCK_LINE_DATA = {
  labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
  datasets: [
    {
      label: "PGP (Promedio General Ponderado)",
      data: [1.02, 1.15, 1.08, 1.25, 1.34, 1.45],
      borderColor: "#10b981", 
      backgroundColor: "rgba(16, 185, 129, 0.2)",
      tension: 0.4
    },
    {
      label: "Promedio Real (P.G.)",
      data: [0.95, 0.98, 0.96, 1.02, 1.10, 1.12],
      borderColor: "#64748b",
      borderDash: [5, 5],
      tension: 0.4
    }
  ]
};

const MOCK_BAR_DATA = {
  labels: ["S1", "S2", "S3", "S4", "S5", "S6", "S7+"],
  datasets: [{
    label: "Frecuencia de Series",
    data: [45, 30, 22, 15, 8, 3, 1],
    backgroundColor: "#3b82f6"
  }]
};

const MOCK_DONUT_DATA = {
  labels: ["Hcp 20", "Hcp 25", "Hcp 30"],
  datasets: [{
    data: [65, 20, 15],
    backgroundColor: ["#10b981", "#3b82f6", "#6366f1"],
    borderWidth: 0
  }]
};

export default function PlayerStatsDashboard() {
  const [heatmap, setHeatmap] = useState({ T1: 150, T2: 230, T3: 310 });
  const [isExporting, setIsExporting] = useState(false);
  const totalHeat = heatmap.T1 + heatmap.T2 + heatmap.T3;
  const targetPlayerId = "demo-player-id-123";

  const handleExportPDF = async () => {
      setIsExporting(true);
      try {
          const response = await fetch(`/api/player/${targetPlayerId}/export`);
          if (!response.ok) throw new Error("Fallo de exportación");
          
          // Crear url local a partir del blob recibido
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Ficha_Deportiva_${targetPlayerId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
      } catch (error) {
          console.error("Error al descargar PDF:", error);
          alert("Ocurrió un error consolidando el Big Data.");
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
                 <h1 className="text-4xl font-black text-slate-800 tracking-tight">Player Insights</h1>
                 <p className="text-slate-500 font-medium">Analítica Avanzada y Reverse-Engineering</p>
            </div>
            <div className="flex gap-6 items-end">
                 <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
                 >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                        <span>Triturando Data...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <span>Exportar Currículum Deportivo</span>
                      </>
                    )}
                 </button>
                 <div className="text-right border-l border-slate-200 pl-6">
                     <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Jugador Analizado</div>
                     <div className="text-2xl font-black text-emerald-600">CARLOS SÁNCHEZ</div>
                 </div>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* CHART A: LINE CHART (PGP vs PG) */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-lg text-slate-700 mb-6">Evolución de Rendimiento (PGP)</h3>
                <div className="h-80 w-full relative">
                    <Line 
                        data={MOCK_LINE_DATA} 
                        options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0.5 } } }} 
                    />
                </div>
            </div>

            {/* CHART C: DONUT (HCP WINS) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-lg text-slate-700 mb-6">Eficiencia por Distancia</h3>
                <div className="h-64 relative flex justify-center">
                    <Doughnut 
                        data={MOCK_DONUT_DATA} 
                        options={{ responsive: true, maintainAspectRatio: false, cutout: '70%' }} 
                    />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-3xl font-black text-slate-700">65%</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">HCP Corto</div>
                    </div>
                </div>
            </div>

            {/* CHART B: BAR CHART (DISTRIBUTION) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-lg text-slate-700 mb-6">Distribución de Tacadas</h3>
                <div className="h-64 w-full relative">
                    <Bar 
                        data={MOCK_BAR_DATA} 
                        options={{ responsive: true, maintainAspectRatio: false }} 
                    />
                </div>
            </div>

            {/* HEATMAP DE ENTRADAS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                <h3 className="font-bold text-lg text-slate-700 mb-2">Heatmap de Presión Deportiva</h3>
                <p className="text-sm text-slate-500 mb-6">Concentración de carambolas según la fase del partido.</p>
                
                <div className="flex w-full h-12 rounded-xl overflow-hidden mt-8 shadow-inner">
                    <div className="bg-slate-300 flex items-center justify-center transition-all bg-opacity-70 group" style={{ width: `${(heatmap.T1/totalHeat)*100}%` }}>
                        <span className="font-bold text-slate-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Apertura</span>
                    </div>
                    <div className="bg-emerald-400 flex items-center justify-center transition-all group" style={{ width: `${(heatmap.T2/totalHeat)*100}%` }}>
                        <span className="font-bold text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">Medio Juego</span>
                    </div>
                    <div className="bg-rose-500 flex items-center justify-center transition-all group" style={{ width: `${(heatmap.T3/totalHeat)*100}%` }}>
                        <span className="font-black text-white text-sm tracking-widest drop-shadow">EL CIERRE</span>
                    </div>
                </div>
                
                <div className="flex justify-between mt-4 text-xs font-bold text-slate-400 uppercase">
                    <div className="text-left w-1/3">Apertura<br/><span className="text-slate-600 text-lg">{heatmap.T1} pts</span></div>
                    <div className="text-center w-1/3">Media<br/><span className="text-emerald-600 text-lg">{heatmap.T2} pts</span></div>
                    <div className="text-right w-1/3">Cierre Crítico<br/><span className="text-rose-600 text-lg">{heatmap.T3} pts</span></div>
                </div>
            </div>
        </div>

        {/* HEAD TO HEAD COMPARATOR */}
        <section className="mt-12 bg-slate-900 rounded-3xl p-8 text-white shadow-xl bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-emerald-400 tracking-tight">Tribunal Head-to-Head</h2>
                    <p className="text-slate-400">Comparativa directa del historial competitivo</p>
                </div>
                <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-6 py-3 font-bold uppercase tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option>vs D. Mota</option>
                    <option>vs L. Gomez</option>
                    <option>vs R. Reyes</option>
                </select>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center items-center">
                {/* J1 */}
                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                     <div className="text-5xl font-black text-white">4</div>
                     <div className="text-sm font-bold text-slate-400 uppercase mt-2">Victorias</div>
                     
                     <div className="mt-8 border-t border-slate-700 pt-4 flex justify-between px-4">
                         <div><p className="text-xs text-slate-500">PGP</p><p className="font-bold text-emerald-400">1.340</p></div>
                         <div><p className="text-xs text-slate-500">Mejor HR</p><p className="font-bold text-white">8</p></div>
                     </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Total Partidos: 6</span>
                    <div className="h-20 w-20 bg-slate-950 border-4 border-slate-800 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-black text-slate-600 italic">VS</span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-600 mt-4">2 Empates</span>
                </div>

                {/* J2 */}
                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                     <div className="text-5xl font-black text-white">0</div>
                     <div className="text-sm font-bold text-slate-400 uppercase mt-2">Victorias</div>
                     
                     <div className="mt-8 border-t border-slate-700 pt-4 flex justify-between px-4">
                         <div><p className="text-xs text-slate-500">PGP</p><p className="font-bold text-rose-400">0.890</p></div>
                         <div><p className="text-xs text-slate-500">Mejor HR</p><p className="font-bold text-white">5</p></div>
                     </div>
                </div>
            </div>
        </section>

      </div>
    </div>
  );
}
