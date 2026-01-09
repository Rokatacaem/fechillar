"use client";

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TransparencyPanel() {
    const data = {
        labels: ['Torneos Nacionales', 'Desarrollo Juvenil', 'Gastos Administrativos', 'Capacitación'],
        datasets: [
            {
                label: 'Presupuesto 2025',
                data: [45, 25, 20, 10],
                backgroundColor: [
                    '#003366', // Primary
                    '#D52B1E', // Secondary
                    '#708090', // Slate
                    '#005C3A', // Green
                ],
                borderWidth: 0,
            },
        ],
    };

    const options = {
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                    }
                }
            }
        },
        cutout: '70%',
    };

    return (
        <section className="py-24 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Text & Buttons */}
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-primary)] mb-6">
                            Transparencia Activa
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Comprometidos con la integridad y la claridad en la gestión de recursos públicos y privados. Accede a nuestros informes financieros actualizados.
                        </p>

                        <div className="space-y-4">
                            <button className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-between gap-4 transition-colors group">
                                <span className="font-medium">Actas de Directorio 2025</span>
                                <span className="text-slate-400 group-hover:text-[var(--color-primary)]">↓ PDF</span>
                            </button>
                            <button className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-between gap-4 transition-colors group">
                                <span className="font-medium">Balance Anual 2024</span>
                                <span className="text-slate-400 group-hover:text-[var(--color-primary)]">↓ PDF</span>
                            </button>
                            <button className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-between gap-4 transition-colors group">
                                <span className="font-medium">Estatutos de la Federación</span>
                                <span className="text-slate-400 group-hover:text-[var(--color-primary)]">↓ PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Chart */}
                    <div className="bg-slate-50 p-8 rounded-3xl flex flex-col items-center justify-center relative">
                        <h3 className="absolute top-8 left-8 text-sm font-bold text-slate-400 uppercase tracking-wider">Ejecución Presupuestaria</h3>
                        <div className="w-full max-w-sm">
                            <Doughnut data={data} options={options} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-[var(--color-primary)] mt-10">2025</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
