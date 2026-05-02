"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface DataPoint {
    name: string;
    points: number;
}

interface PerformanceChartProps {
    data: DataPoint[];
    color?: string;
    label?: string;
}

export function PerformanceChart({ data, color, label }: PerformanceChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                No hay datos históricos suficientes.
            </div>
        );
    }

    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                fill: true,
                label: label || 'Rating SGF',
                data: data.map(d => d.points),
                borderColor: color || '#8b5cf6', 
                backgroundColor: color ? `${color}1A` : 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#10b981', 
                pointBorderColor: '#020817',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.4, 
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#cbd5e1',
                bodyColor: '#10b981',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function(context: any) {
                        return `${context.parsed.y} ${label === 'PGP' ? '' : 'Puntos'}`;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        family: 'mono',
                        size: 10,
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        family: 'mono',
                        size: 10,
                    }
                },
                beginAtZero: false,
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <div className="w-full h-64 overflow-x-auto">
            <div className="min-w-[500px] h-full">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
}
